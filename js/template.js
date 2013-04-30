$().ready(function() {
	vista = new VistaPrincipal({el:"#mainchart"});
});

var VistaPrincipal = Backbone.View.extend(
/** @lends VistaPrincipal.prototype */
{

	/**
	* @class VistaPrincipal vista que despliega visualizacion de ingresos vs costos de carreras
	*
	* @augments Backbone.View
	* @constructs
	*
	* @param {object} options parametros de incializacion
	* @param {string} options.el Identificador de elemento en DOM donde se despliegau la vista
	* 
	* VistaPrincipal Inicia parametros de configuración y llamada a datos
	*/
	initialize : function() {
    	// Auxiliar para referirse a this al interior de callback functions
    	var self = this

		// Carga de datos
    	this.vistaLoading = new VistaLoading({el:this.el});
		this.vistaLoading.show();
		d3.tsv("data/empleabilidad2.txt", function(data) {
			self.vistaLoading.hide();

			self.data = data;
			self.render();
		});
	},

	/**
	* Despliegue inicial de elementos gráficos.
	*/
	render : function() {

		// Genera contenedores de elementos (paneles, gráfico, ...)
		// ========================================================
		
		// Contenedor del panel de áreas
		var elSelectorAreas = d3.select(this.el).append("div").attr("id", "panelSelectorAreas")[0][0];

		// SVG - contenedor principal de elementos visuales
		this.svg = d3.select(this.el).append("svg")

		// Contenedor del panel de tipos
		var elSelectorTipoIEs = d3.select(this.el).append("div")
			.attr("id", "panelSelectorTipos")
			.style("padding-left", "200px")[0][0];


		// Vista con tooltip para mostrar ficha de establecimiento
		this.tooltip = new VistaToolTip();

		// Genera nueva vista que  despliega visualización
		this.vizView = new VistaVizPayback({
			svg: this.svg,
			data: this.data,
			tooltip : this.tooltip
		});

		// Cea un nuevo panel para seleccionar tipos de IEs ("Universidades", "Institutos Profesionales", ...)
    	// -------------------------------------------------
		// Genera contenido del panel y escucha a evento con tipo seleccionado
		this.vistaSelectorTipoIE= new VistaPanelTipoIE({el:elSelectorTipoIEs, colorScale: this.vizView.getColorScale()});
		this.vistaSelectorTipoIE.on("seleccionTipoIE", this.vizView.seleccionTipoIE);


		// Crea un nuevo panel para seleccionar áreas
		// -----------------------------------------
		// Genera el contenido del panel y escucha a evento con area seleccionada
		this.vistaSelectorAreas = new VistaPanelSelectorAreas({el: "#panelSelectorAreas", areas: this.vizView.getAreas()})
		this.vistaSelectorAreas.on("seleccionArea", this.vizView.seleccionArea);


	}
});


var VistaVizPayback = Backbone.View.extend(
/** @lends VistaVizPayback.prototype */
	{

	/**
	* @class VistaPrincipal vista que despliega visualizacion de ingresos vs costos de carreras
	*
	* @augments Backbone.View
	* @constructs
	*
	* @param {object} options parametros de incializacion
	* @param {array} options.data arreglo con datos (cada dato es un objeto con atributos)
	* @param {d3.select()} options.svg elemento SVG utilizado como contenedor del gráfico
	* @param {Backbone.View} options.tooltip vista utilizada como tooltip
	* VistaVizPayback Inicia parametros de configuración y llamada a datos
	*/
	initialize: function() {
		this.svg = this.options && this.options.svg ? this.options.svg : document.createElementNS('http://www.w3.org/2000/svg', "g");
		this.data = this.options && this.options.data ? this.options.data : [];
		this.tooltip = this.options && this.options.tooltip ? this.options.tooltip : new VistaToolTip();

		// Binding de this (esta vista) al contexto de las funciones indicadas
		_.bindAll(this,"render", "tootipMessage", "seleccionTipoIE", "seleccionArea")

		// Alias a this para ser utilizado en callback functions
		var self = this; 
		
		// Configuración de espacio de despliegue de contenido en pantalla
		this.margin = {top: 20, right: 20, bottom: 30, left: 200},
    	this.width = 1000 - this.margin.left - this.margin.right,
    	this.height = 400 - this.margin.top - this.margin.bottom;

		// Parámetros utilizados en el Gráfico
		this.attrx = "costo_estimado";  // Atributo de eje X
		this.attry = "ingreso_agno4";	// Atributo en eje Y
		this.attrcolor = "tipo_institucion_nivel_1"; // Atributo para selección de color en puntos
		this.attrfilter = "area"; // Atributo para filtro de datos
 		this.radious = 10; 			// Radio único utilizado por los nodos

 		// Etiquetas utilizadas en ejes X e Y
		this.etiquetas = {
			"ingreso_agno4": "Ingreso al 4º año",
			"duracion": "Duración (años)",
			"arancel" : "Arancel (millones $)",
			"costo_estimado" : "Costo estimado (arancel x duracion)"
		};

		this.svg = this.svg
			.attr("width", this.width + this.margin.left + this.margin.right)
		    .attr("height", this.height + this.margin.top + this.margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

  		// Reescribe función generadora del mensaje en tooltip
		this.tooltip.message = this.tootipMessage;


		// Limpia Data
		// ===========
		// Limpia datos de entrada (P.Ej. Cambiar duración de semestres a años)
		this.data = _.map(this.data, function(d) {
			//d.desercionagno1 = parseFloat(d.desercionagno1.replace(/\.|%/g,'').replace(/,/g,'.')).toString();
			d.duracion_real = d.duracion_real/2;  // Cambiar a años
			d.costo_estimado = d.arancel*d.duracion_real; // Genera nuevo atributo de costo carrera
			d.id = d.institucion+d.carrera; //Simula un id único al no venir en los datos
			return d;
		})

		// Calcula Parámetros
		// ==================
		//Calcula parámetros que dependen de los datos

		// Tipos de IE (Universidades, CFT, ...)
		// Es utilizado para cambiar el color de cada nodo 
		this.tiposIEs = _.unique(_.pluck(this.data, this.attrcolor)).sort();

		// Arreglo con los tidos de IES que están seleccionados para mostrarsse de manera destacada
		// originalmente se sólo la última opción
		this.tiposSeleccionados = this.tiposIEs;  

		// Obtiene un arreglo con los nombres de las áreas (Ej ["Salud", "Educación", ...])
		this.areas = _.unique(_.pluck(this.data,this.attrfilter)).sort();
		// Selecciona la primera área como areaSeleccionada
		this.areaSeleccionada = this.areas.length >0 ? this.areas[0] : ""; 

		// Filtra Data
		// ===========
		// Datos seleccionados que serán utilizados para graficar
		// Originalmente filtro los correspondoientes a la primera area (this.areaSeleccionada)
		this.filteredData = _.filter(this.data, function(d) {
			return 	(d.area == self.areaSeleccionada) &&			// Carreras del área seleccionada
					(parseFloat(d[self.attrx])>0) && 	// Atributo x es un número válido
					(d[self.attry] != "s/i");			// Atributo y es categoría valida (no s/i)
		});

		// Genera escalas
		// ==============
		// Genera escala de color utilizada en el gráfico
		this.colorScale = d3.scale.category10();
		// El dominio corresponde a los tipos de IEs
		this.colorScale.domain(this.tiposIEs);

		// parametros de Ingreso: nombres (utilizado en eje Y); y piso (utilizado para calcular tiempo de break even)
		this.parametrosIngreso= {
			"Menor a $400 mil" : 200000,
    		"De $400 mil a $600 mil" : 400000,
			"De $600 mil a $800 mil" : 600000,
			"De $800 mil a $1 millón" : 800000,
			"De $1 millón a $1 millón 200 mil" : 1000000,
			"De $1 millón 200 mil a $1 millón 400 mil" : 1200000,
			"De $1 millón 400 mil a $1 millón 600 mil" : 1400000,
			"De $1 millón 600 mil a $1 millón 800 mil" : 1600000,
			"De $1 millón 800 mil a $2 millones" : 1800000,
			"Sobre $2 millones" : 2000000};

		// Arreglo con nombres de categorías de Ingreso
		var domainIngreso = _.keys(this.parametrosIngreso);

		// Escala Y
		// Escala ordinal con dominio en  tramos de ingreso
		this.yScale = d3.scale.ordinal()
			.domain(domainIngreso)
			.rangePoints([this.height, 0], 1);

		// Escala X
		// Escala lineal con dominio en attrX (costo estimado de carrera)
		// Genera escalas utilizadas en gráfico X/Y
		this.xScale = d3.scale.linear()
    		.range([0, this.width])
			.domain(d3.extent(this.data, function(d) { 
				return parseFloat(d[self.attrx])
			})).nice();


		// Crea Ejes X e Y
		// ===============
		// Construye ejes X e Y
		this.xAxis = d3.svg.axis()
		    .scale(this.xScale)
		    .orient("bottom");

		this.yAxis = d3.svg.axis()
		    .scale(this.yScale)
		    .orient("left")

		// Vista que dibuja ejes X e Y en elemento SVG
 		this.ejes = new VistaEjesXY({
			svg: this.svg,
			x:this.xScale, y:this.yScale, 
			height: this.height, width: this.width, 
			labelX: this.etiquetas[this.attrX],labelY: this.etiquetas[this.attrY]
		})


		this.render();
 
	},

	/**
	* Reescribe función generador de mensajes utilizado en herramienta de tooltip
	* tooltip.tooltipMessage(data) 	
	*
	* @param {object} data objeto con atributos (Ej: {nombre: "Juan", Edad: 18}) utilizados en la creación del mensaje a desplegar por tooltip
	* @returns {string} Mensaje (html) a ser utilizado por tooltip
	*/
	tootipMessage : function(data) {
	
		var formatMiles = d3.format(",d");
		var formatDecimal = d3.format('.2f')

		msg = "<strong>"+data.institucion+"</strong>";
		msg += "<br><span class='text-info'>"+data.carrera+"</span>";
		msg += "<br>Duración media real: " + data.duracion_real +" años";
		msg += "<br>Arancel anual: $" + formatDecimal(data.arancel/1000000)+" millones";
		msg += "<br>Costo estimado (arancel x duracion): $" + formatDecimal(data.costo_estimado/1000000)+" millones";
		msg += "<br>Break even (costo/piso ingreso año 4): " + formatDecimal(data.costo_estimado/this.parametrosIngreso[data.ingreso_agno4]/12)+" años";
		
		return msg;
	}, 

	
	/**
	* Selecciona un nuevo tipo de institucion (Ej. "Universidades").  Este método debe llamarse al detectar un evento que 
	* indique una nueva selección de tipos por parte de un panel de usuario.  
	*
	* @param {array} tiposSeleccionados arreglo con texto de tipos de IEs seleccionados (Ej. ["Centros e Formación Técnica", "Universidades"])
	*/
	seleccionTipoIE : function(tiposSeleccionados) {
		this.tiposSeleccionados = tiposSeleccionados;
		this.render();
	},

	
	/**
	* Selecciona una nueva área discipplinar (Ej. "Educación"). 
	* Este método debe llamarse al detectar un evento que indique una nueva selección de área 
	* en un panel de usuario (this.vistaSelectorAreas)
	*
	* @param {string} areaSeleccionada nombre de área seleccionada (Ej. "Salud")
	*/
	seleccionArea : function(areaSeleccionada) {
		var self = this;

		this.areaSeleccionada = areaSeleccionada;

		// Filtrar los datos por el area seleccionada (Ej. Educación) y adicionalmente
		// por aqellos que tengan attrx >0 & attry != a "s/i"
		this.filteredData = _.filter(this.data, function(d) {
			return 	(d.area == self.areaSeleccionada) &&			// Carreras del área seleccionada
					(parseFloat(d[self.attrx])>0) && 	// Atributo x es un número válido
					(d[self.attry] != "s/i");			// Atributo y es categoría valida (no s/i)
		});

		this.render();
	},

	/**
	* Obtiene la escala de colores del gráfico.
	* @return {d3.scale}
	*/
	getColorScale : function() {
		return this.colorScale;
	},

	/**
	* Obtiene arreglo con el listado de áreas (disciplinas) de los datos en el gráfico
	* @return {array}
	*/
	getAreas : function() {
		return this.areas;
	},

	/**
	* Despliegue inicial de elementos gráficos.
	*/
	render: function() {
		var self = this; // Auxiliar para referirse a this en funciones callback

		// Calcula el dominio de las escala x en base al valor de los ultimos datos seleccionados 
		this.xScale.domain(d3.extent(this.filteredData, function(d) { return d[self.attrx]})).nice();

		// Configura etiquetas para ejes X e Y
		this.ejes.labelX = this.etiquetas[this.attrx];
		this.ejes.labelY = this.etiquetas[this.attry];

		// Vuelve a dibujar ejes X e Y
		this.ejes.redraw();

		// Join entre datos y nodos tipo "circle"
		this.nodes = this.svg.selectAll("circle")
			.data(this.filteredData, function(d) {
				// Usa como key atributo id (creado en render como concatenación de institucion+carrera)
				return (d.id)
			})

		// Eliminar los nodos para los cuales no hay asociación de datos
		this.nodes.exit()
			.transition()
			.duration(1000)
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
				self.tooltip.show(d)}
				)
			.on("mouseleave", function(d) {
				self.tooltip.hide()}
				)

		// Actualizar despliegue de nodos existentes
		this.nodes
			.transition()
			.duration(1000)
			// Ubica nodos en posioción definitiva del gráfico
			.attr("cx", function(d) {return self.xScale(d[self.attrx])})
			.attr("cy", function(d) {return self.yScale(d[self.attry])})
			// Todos los nodos con radio fijo (Ej. 10)
			.attr("r", function(d) {return self.radious})
			// Color depende del valor de attributo attrcolor (Ej. tipo_institución)
			.attr("fill", function(d) {return self.colorScale(d[self.attrcolor])})
			// Opacidad depende de si el tipo de institución está entre los tipos seleccionados
			.attr("opacity", function(d) {
				// Verificar si el tipo de IE está cintenida en los tipos seleccionados
				// y asignar valor de opacidad en concordancia
				return _.contains(self.tiposSeleccionados, d[self.attrcolor]) ? 0.95 : 0.05
			})
	}

});




var VistaPanelTipoIE = Backbone.View.extend(
/** @lends VistaPanelTipoIE.prototype */
{
	/**
	* @class VistaPanelTipoIE Panel con un elementos (checkboxes) que permiten seleccionar un conjunto de "tipos de IEs" (Ej. ["Universidades", "Institutos Profesionales"])
 	*
	* @augments Backbone.View
	* @constructs
	*
	* @param {object} options parametros de incializacion
	* @param {string} options.el Identificador de elemento en DOM donde se despliegau la vista
	* @param {string} options.colorScale escala ordinal de d3 con categorías en domain() y colores en range()
	*/
	initialize: function() {
		this.colorScale = (this.options && this.options.colorScale) ? this.options.colorScale : d3.scale.ordinal();
		this.render();
	},


	events: {
		"change input": "seleccionTipoIE",
	},

	/**
	* Método invocado al detectar evento "change" en la selección de opciones
	* 
	* @param {object} e Evento 	
	* @fires VistaPanelTipoIE#seleccionTipoIE
	*/
	seleccionTipoIE: function(e) {
		// Obtiene arreglo con botones activos
		var selectedButtons = d3.select(this.el).selectAll("input:checked")[0];

		// Genera un arreglo con el texto de cada botón activo
		var selectedValues = _.map(selectedButtons, function(d) {
			return $(d).val();

		})

		/**
		 * Evento que indica una selección de tipos de IE.
		 *
		 * @event VistaPanelTipoIE#seleccionTipoIE
		 * @type {array}
		 * @property {array} selectedValues - Arreglo con listado de tipos seleccionados (Ej. ["Universidades", "Institutos Profesionales"])
		 */
		this.trigger("seleccionTipoIE", selectedValues);
	},

	/**
	* Despliegua elementos visuales 	
	*/
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





var VistaPanelSelectorAreas = Backbone.View.extend(
/** @lends VistaPanelSelectorAreas.prototype */
  {
	/**
	* @class VistaPanelSelectorAreas Panel con un elemento "select" que permite escoger un área que será utilizada para modificar el despliegue del gráfico
	*
	* @augments Backbone.View
	* @constructs
	*
	* @param {object} options parametros de incializacion
	* @param {string} options.el Identificador de elemento en DOM donde se despliegau la vista
	* @param {string} options.areas Arreglo con el listado de áreas a seleccionar (Ej. ["Salud", "Educación", ...])
	*/
	initialize: function() {
		this.areas = this.options && this.options.areas ? this.options.areas : [];
		this.render()
	},

	events: {
		"change select#id_inputArea" : "seleccionArea"
	},
	

	/**
	* Método invocado al detectar evento "change" en el select con opciones de área
	* 
	* @param {object} e Evento 	
	* @fires VistaPanelSelectorAreas#seleccionArea
	*/
	seleccionArea : function(e) {
		area = $(e.target).val();

		/**
		 * Evento que indica una selección de área.
		 *
		 * @event VistaPanelSelectorAreas#seleccionArea
		 * @type {string}
		 * @property {string} area - Area seleccionada (Ej. "Salud")
		 */
		this.trigger("seleccionArea", area)
	},

	/**
	* Despliegua elementos visuales 	
	*/
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


var VistaLoading = Backbone.View.extend(
/** @lends VistaLoading.prototype */
  {

	/**
	* @class VistaLoading Muestra / oculta un indicador de carga de datos
	*
	* @augments Backbone.View
	* @constructs
	*
	*/
	initialize: function() {
		this.render();
	},

	/**
	* Muestra el indicador de carga 	
	*
	*/
	show: function() {
		this.$indicator.show();
	},

	/**
	* Esconde el indicador de carga 	
	*
	*/
	hide: function() {
		this.$indicator.hide();
	}, 

	/**
	* Despliegua elementos visuales 	
	*/
	render: function() {
		this.$indicator = $("<div>");
		this.$indicator.append("<progress>");
		this.$indicator.append("<label>Cargando ...</label>");

		this.$el.append(this.$indicator);
	}
});



