$().ready(function() {
	console.log("ready");
	vista = new VistaPrincipal({el:"#mainchart"});
});

// VistaPrincipal
// ===================
// Vista principal con datos de ...
//
var VistaPrincipal = Backbone.View.extend({

	initialize: function() {
		// Se ascocia this (esta vista) al contexto de las funciones indicadas
		_.bindAll(this,"render", "tipoIESeleccionada", "areaSeleccionada")

		self= this; // Alias a this para ser utilizado en callback functions

		// Configuración de espacio de despliegue de contenido en pantalla
		this.margin = {top: 20, right: 20, bottom: 30, left: 200},
    	this.width = 1000 - this.margin.left - this.margin.right,
    	this.height = 400 - this.margin.top - this.margin.bottom;

 		// Vista con tooltip para mostrar ficha de establecimiento
		//this.tooltip = new VistaToolTipEstablecimiento();
		this.tooltip = new VistaToolTip();
		this.tooltip.message = this.tootipMessage;
		
		// Parámetros utilizados en el Gráfico
		this.attrx = "costo_estimado";  // Atributo de eje X
		this.attry = "ingreso_agno4";	// Atributo en eje Y
		this.attrsize = "";				// Atributo en base al cual se calcula el radio de cada nodo (no)
 		this.attrTipoIE = "tipo_institucion_nivel_2";
  		this.attrcolor = this.attrTipoIE;	// Atributo en base al cual define color de los nodos


  		// Etiquetas utilizadas en ejes X e Y
		this.etiquetas = {
			"duracion": "Duración (años)",
			"arancel" : "Arancel (millones $)",
			"costo_estimado" : "Costo estimado (arancel x duracion)"
		};

    	// Carga de datos
    	//
		this.$el.append("<progress id='progressbar'></progress>");
		d3.tsv("data/empleabilidad2.txt", function(data) {
			$("#progressbar").hide(); // Ocultar barra de progreso

			self.data = data;
			self.render();
		});
	},

	// tooltipMessage
	// --------------
	// Reescribe función generador de mensajes utilizado en herramienta de tooltip
	// tooltip.tooltipMessage(data)
	// Parámetros:
	// data: objeto con atributos (Ej: {nombre: "Juan", Edad: 18})
	tootipMessage : function(data) {
	
		formatMiles = d3.format(",d");
		formatDecimal = d3.format('.2f')

		msg = "<strong>"+data.institucion+"</strong>";
		msg += "<br><span class='text-info'>"+data.carrera+"</span>";
		msg += "<br>Duración media real: " + data.duracion_real +" años";
		msg += "<br>Arancel anual: $" + formatDecimal(data.arancel/1000000)+" millones";
		msg += "<br>Costo estimado (arancel x duracion): $" + formatDecimal(data.costo_estimado/1000000)+" millones";
		
		return msg;
	}, 


	// Selecciona un nuevo tipo de institucion
	// Parámetros:
	// tiposSeleccionados:  arreglo con texto de tipos de IEs seleccionados (Ej. ["Centros e Formación Técnica", "Universidades"])
	tipoIESeleccionada : function(tiposSeleccionados) {
		this.tiposSeleccionados = tiposSeleccionados;
		this.reDraw();
	},

	// Función invocada cuando se seleccione una nueva área
	areaSeleccionada : function(area) {
		this.area= area;

		// Filtrar los datos por el area seleccionada (Ej. Educación) y adicionalmente
		// por aqellos que tengan attrx >0 & attry != a "s/i"
		this.filteredData = _.filter(this.data, function(d) {
			return 	(d.area == self.area) &&			// Carreras del área seleccionada
					(parseFloat(d[self.attrx])>0) && 	// Atributo x es un número válido
					(d[self.attry] != "s/i");			// Atributo y es categoría valida (no s/i)
		});

		this.reDraw();
	},

	// reDraw
	// ------
	// Función que dibuja los elementos del gráfico 
	// Es llamada cada vez que se hace un cambuo (p.ej. selección de una nueva área)
	reDraw: function() {
		var self = this;

		// Calcula el dominio de las escala x en base al valos de los datos que van en ejes 
		this.xScale.domain(d3.extent(this.filteredData, function(d) { return d[self.attrx]})).nice();

		// Configura etiquetas para ejes x e y
		this.ejes.labelX = this.etiquetas[this.attrx];
		this.ejes.labelY = this.etiquetas[this.attry];

		// Vuelve a dibujar ejes X e Y
		this.ejes.redraw();

		// Join entre datos y nodos tipo "circle"
		this.nodes = this.svg.selectAll("circle")
			.data(this.filteredData, function(d) {return (d.institucion+d.carrera)})

		// Eliminar los nodos para los cuales no hay asociación de datos
		this.nodes.exit()
			.transition()
			.duration(2000)
				// Traslada nodos al origen y luego los elimina
				.attr("cx", 0)
				.attr("cy", this.height)
				.attr("r", 0)
				.remove()

		// Agregar nuevos nodos asociados a datos
		this.nodes.enter()
			// Crea nuevos nodos con opacidad base (0.95)
			.append("circle")
			.attr("opacity", 0.8)
			// Los ubica en el origen
			.attr("cx", 0)
			.attr("cy", this.height) // Los ubica en esquina inferior izquierda originalmente
			// Captura eventos para uso de tootlip
			.on("mouseenter", function(d) {
				pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}
				self.tooltip.show(d)}
				)
			.on("mouseleave", function(d) {self.tooltip.hide()})

		// Actualizar despliegue de nodos existentes
		this.nodes
			.transition()
			.duration(1000)
			// Ubica nodos en posioción definitiva del gráfico
			.attr("cx", function(d) {return self.xScale(d[self.attrx])})
			.attr("cy", function(d) {return self.yScale(d[self.attry])})
			// Todos los nodos con radio fijo (10)
			.attr("r", function(d) {return 10})
			// Color depende del valor de attributo attrcolor (Ej. tipo_institución)
			.attr("fill", function(d) {return self.colorScale(d[self.attrcolor])})
			// Opacidad depende de si el tipo de institución está entre los tipos seleccionados
			.attr("opacity", function(d) {
				// Verificar si el tipo de IE está cintenida en los tipos seleccionados
				// y asignar valor de opacidad en concordancia
				return _.contains(self.tiposSeleccionados, d[self.attrTipoIE]) ? 0.95 : 0.05
			})

	},


	render: function() {
		console.log("render");
		self = this; // Para hacer referencia a "this" en callback functions

		$element = this.$el; // Auxiliar para selector Jquery del elemento DOM de esta vista

		// Limpia datos de entrada (P.Ej. Cambiar duración de semestres a años)
		this.data = _.map(this.data, function(d) {
			//d.desercionagno1 = parseFloat(d.desercionagno1.replace(/\.|%/g,'').replace(/,/g,'.')).toString();
			d.duracion_real = d.duracion_real/2;  // Cambiar a años
			d.costo_estimado = d.arancel*d.duracion_real; // Genera nuevo atributo de costo carrera
			return d;
		})


		//Calcula parámetros que dependen de los datos

		// Tipos de IE (Universidades, CFT, ...)
		// Es utilizado para cambiar el color de cada nodo 
		this.tiposIEs = _.unique(_.pluck(this.data, this.attrTipoIE)).sort();

		// Arreglo con los tidos de IES que están seleccionados para mostrarsse de manera destacada
		// originalmente se sólo la última opción
		this.tiposSeleccionados = this.tiposIEs;  

		// Obtiene un arreglo con los nombres de las áreas
		this.areas = _.unique(_.pluck(this.data,"area")).sort();
		this.area = this.areas.length >0 ? this.areas[0] : ""; // Area seleccionada 

		// filteredData:  utilizada para la graficación
		this.filteredData = _.filter(this.data, function(d) {
			return 	(d.area == self.area) &&			// Carreras del área seleccionada
					(parseFloat(d[self.attrx])>0) && 	// Atributo x es un número válido
					(d[self.attry] != "s/i");			// Atributo y es categoría valida (no s/i)
		});

		// Genera escala de color utilizada en el gráfico
		this.colorScale = d3.scale.category10();
		this.colorScale.domain(this.tiposIEs);

		// Panels con opciones de visualización	(genera eventos selectVisualizacion o selectVulnerablidad
    	// según las opciones seleccionadas)	
		this.vistaOpciones= new VistaPanelTipoIE({el:"#panelOpciones", colorScale: this.colorScale});
		this.vistaOpciones.on("tipoIESeleccionada", this.tipoIESeleccionada);


		// Crea un nuevo panel para seleccionar áreas
		// -----------------------------------------
		// Crea nuevo div que contendrá el panel
		var elSelectorAreas = d3.select(this.el).append("div").attr("id", "panelSelectorAreas")
		// Genera el contenido del panel y escucha a evento con area seleccionada
		this.vistaSelectorAreas = new VistaPanelSelectorAreas({el: "#panelSelectorAreas", areas: this.areas})
		this.vistaSelectorAreas.on("areaSeleccionada", this.areaSeleccionada);


		// Genera elemento SVG contenedor principal de gráficos
		this.svg = d3.select(this.el).append("svg")
		    .attr("width", this.width + this.margin.left + this.margin.right)
		    .attr("height", this.height + this.margin.top + this.margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
	

		// Genera escalas utilizadas en gráfico X/Y
		this.xScale = d3.scale.linear()
    		.range([0, this.width]);

    	var domainIngreso= [
    	 	"Menor a $400 mil",
    		"De $400 mil a $600 mil",
			"De $600 mil a $800 mil",
			"De $800 mil a $1 millón",
			"De $1 millón a $1 millón 200 mil",
			"De $1 millón 200 mil a $1 millón 400 mil",
			"De $1 millón 400 mil a $1 millón 600 mil",
			"De $1 millón 600 mil a $1 millón 800 mil",
			"De $1 millón 800 mil a $2 millones",
			"Sobre $2 millones"
		]


		this.yScale = d3.scale.ordinal()
			.domain(domainIngreso)
			.rangePoints([this.height, 0], 1);

		// Calcula el dominio de las escalas en base al valos de los datos que van en ejes 
		// x (psu Lenguaje) e y (financiamiento)
		this.xScale.domain(d3.extent(this.data, function(d) { return parseFloat(d[self.attrx])})).nice();
		//this.yScale.domain(d3.extent(this.data, function(d) { return parseFloat(self.cleanStringInt(d[self.attry]))})).nice();


		// Construye ejes X e Y
		this.xAxis = d3.svg.axis()
		    .scale(this.xScale)
		    .orient("bottom");

		this.yAxis = d3.svg.axis()
		    .scale(this.yScale)
		    .orient("left")

 		this.ejes = new VistaEjesXY({
			svg: this.svg,
			x:this.xScale, y:this.yScale, 
			height: this.height, width: this.width, 
			labelX: this.etiquetas[this.attrX],labelY: this.etiquetas[this.attrY]
		})

 		// Dibuja los elementos del gráfico
		this.reDraw();

	}

});


 
// VistaPanelTipoIE
// ==================
// Crea un panel con opciones para seleccionar el tipo de Institución (Universidades, Institutos profesionales, ..)
// Parámetros de construccion  v = new VistaPanelTipoIE({el: el, colorScale: colorScale})
// el: identificador del elemento del DOM en el cual se desplegará el panel
// colorScale : escala ordinal de d3 con categorías en domain() y colores en range()
var VistaPanelTipoIE = Backbone.View.extend({
	events: {
		"change input": "tipoIESeleccionada",
	},

	initialize: function() {
		this.colorScale = (this.options && this.options.colorScale) ? this.options.colorScale : d3.scale.ordinal();
		this.render();
	},

	tipoIESeleccionada: function(e) {
		// Obtiene arreglo con botones activos
		$(this.el).find("input:checked")

		var selectedButtons = d3.select(this.el).selectAll("input:checked")[0];

		// Genera un arreglo con el texto de cada botón activo
		var selectedValues = _.map(selectedButtons, function(d) {
			return $(d).val();

		})
		this.trigger("tipoIESeleccionada", selectedValues);
	},

	// Define escala de colores que es utilizada para obtener los nombres de las opciones (domain) y 
	// los respectivos colores
	setColorScale: function(colorScale) {
		this.colorScale = colorScale;
	},

	render: function() {
		var optionsGroup = d3.select(this.el).append("form")
			.attr("class", "form-horizontal")
			.selectAll("label")
			.data(this.colorScale.domain())
			.enter()
				.append("label")
				.attr("class","checkbox inline");

		optionsGroup.append("input")
			.attr("type", "checkbox")
			.attr("checked", true)
			.attr("value", function(d) {return d})

		optionsGroup.append("span")
			.text(function(d) {return d})
			.style("background-color", this.colorScale)

		// Activa el último botón (vía JQuery)
		$(this.el).find("button").last().button('toggle');

		return this;
	}
});

// VistaPanelSelectorAreas
var VistaPanelSelectorAreas = Backbone.View.extend({
	events: {
		"change select#id_inputArea" : "areaSeleccionada"
	},
			

	initialize: function() {
		this.areas = this.options && this.options.areas ? this.options.areas : [];
		this.render()
	},

	areaSeleccionada : function(e) {
		area = $(e.target).val();

		this.trigger("areaSeleccionada", area)
	},

	render: function() {
		// Genera menu con opciones de Area del Conocimiento (Educación, Ciencias Sociales, ...)
		var selectorArea = d3.select(this.el)
			.append("form")
				.attr("class", "form-inline")
			.append("div")
				.attr("class", "control-group")

		selectorArea.append("label")
			.attr("class", "control-label")
			.attr("for", "id_inputArea")
			.style("margin-right", "10px")
			.text("Area:   ");

		selectorArea.append("select")
			.attr("id", "id_inputArea")
			.selectAll("option")
			.data(this.areas)
			.enter()
				.append("option")
				.attr("value", function(d) {return d})
				.text(function(d) {return  d})
	}
});


