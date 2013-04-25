var col;

$().ready(function() {

	vistaCarreras = new VistaCarreras2({el:"#carreras"});

	window.testView = vistaCarreras;


});



var VistaCarreras2 = Backbone.View.extend({
	el:"body",

	events: {
        'mouseenter .node-dot': 'mouseovernode',
        'mouseleave .node-dot': 'mouseleavenode'
    },

    mouseovernode: function(e) {
    	var selectednode= d3.select(e.target).attr("fill","yellow");
    	datum = selectednode.datum();
        $("#msg").html(datum.CARRERA + "-"+datum.INSTITUCION+" ("+datum.ACREDITACION_CARRERA+")");
        this.tooltip.html(datum.CARRERA + "-"+datum.INSTITUCION+" ("+datum.ACREDITACION_CARRERA+")");
        this.tooltip
        	.style('top',e.pageY)
        	.style('left',e.pageX);

    },

    mouseleavenode: function(e) {
    	d3.select(e.target).attr("fill","black");
    	datum = d3.select(e.target).datum();
        $("#msg").html(".");
    },

	
	initialize: function() {
		$this = this;

		// Vista con tooltip para mostrar datos del item
		this.tooltip = new VistaToolTip();
		this.tooltip.message = this.tootipMessage;
 
 		this.$el.html("Cargando datos ...");
		d3.tsv("./matriculaIEs.txt", function(d) {
			$this.datacarreras = d;
			$this.render();
		})


	},
	
	// tooltipMessage
	// --------------
	// Genera el texto (html) que se desplegará en el tooltip
	// utilizando datos del objeto "data"  (Ej. data = {nombre:"Juan"})
	tootipMessage: function(data) {
		var msg = "<span class='text-info'>"+data.name+"</span>";

		return msg;
	},
	
	
	render: function() {
		var self = this;
		this.$el.html("");
		$element = this.$el;
		$element.append("<h3>Instituciones de Educación Superior en Chile")



		// Ordenar datos por tipo de acreditación
		var data = _.sortBy(this.datacarreras, function(d) {return d.ACREDITACION_CARRERA});		
		//var data = _.filter(data, function(d) {return d.TIPO_INSTITUCION == "UNIVERSIDAD ESTATAL"});	

		var nestedData = d3.nest()
		.key(function(d) { return "Chile"; })
		.key(function(d) { return d.tipo; })
		.entries(data);

		var forceNodes = []
		var forceLinks = []

		var index = 0;

		var root = nestedData[0]

		var radious = d3.scale.sqrt()
			.range([2,20])
			.domain(d3.extent(this.datacarreras, function(d) {return parseInt(d.pregrado2012)}))


		forceNodes[index] = {name:root.key, group:"Chile"}
		
		
		var tipoUniversidades = root.values
		rootIndex= index;
		_.each(tipoUniversidades, function(tipoUniv, i) {
			index++;
			forceNodes[index] = {name:tipoUniv.key, group:tipoUniv.key};
			tipoUnivIndex = index;
			forceLinks.push({source:rootIndex, target: tipoUnivIndex, value:1})
			var universidades = tipoUniv.values
			_.each(universidades, function(univ, i) {
				index++;
				univIndex = index;
				forceNodes[index] = {name: univ.nombre, group:tipoUniv.key, matricula: univ.pregrado2012};
				forceLinks.push({source:tipoUnivIndex, target: univIndex, value:1})
			})
		});


		var width = 800,
    	height = 600;

		var color = d3.scale.category20();

		var force = d3.layout.force()
		    .charge(-120)
		    .linkDistance(20)
		    .size([width, height]);

		var svg = d3.select("body").append("svg")
		    .attr("width", width)
		    .attr("height", height);


		force
		  .nodes(forceNodes)
		  .links(forceLinks)
		  .start();



		var link = svg.selectAll(".link")
		  .data(forceLinks)
		.enter().append("line")
		  .attr("class", "link")
		  .style("stroke-width", function(d) { return Math.sqrt(d.value); });

		var node = svg.selectAll(".node")
		  .data(forceNodes)
		.enter().append("circle")
		  .attr("class", "node")
		  .attr("r", function(d) {return d.matricula ? radious(d.matricula): 10})
		  .style("fill", function(d) { return color(d.group); })
		  .call(force.drag);
		  
		node.on("mouseover", function(d) {
		     		pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}
					self.tooltip.show(d, pos)}
					)
			.on("mouseout", function(d) {self.tooltip.hide()})

		force.on("tick", function() {
		link.attr("x1", function(d) { return d.source.x; })
		    .attr("y1", function(d) { return d.source.y; })
		    .attr("x2", function(d) { return d.target.x; })
		    .attr("y2", function(d) { return d.target.y; });

		node.attr("cx", function(d) { return d.x; })
		    .attr("cy", function(d) { return d.y; });
		});


	$("body").append(this.tooltip.render().$el);

	}


});

// VistaToolTip
// ----------------------------
// Muestra tooltip con mini ficha del item (se ubica al hacer rollover sobre el item)
var VistaToolTip = Backbone.View.extend({

	initialize: function() {

	},

	// show
	// ----
	// Genera el menaje a mostrar (de acuerdo a datos ingresados) y muestra el tooltip en la
	// posición indicada
	//
	// data: {nombre_establecimientos:"Escuela Arturo Prat", rbd: 123, ...}
	// pos : {x: 100, y: 250}
	show: function(data, pos) {
		$tooltip = this.$el;
		$tooltipcontent = $tooltip.find(".tooltipcontent")


		$tooltipcontent.html(this.message(data));

		//$tooltip.css({"top":pos.y+10+$(window).scrollTop(), "left":pos.x + $(window).scrollLeft()});
		$tooltip.css({"top":pos.y+10, "left":pos.x });

		$tooltip.show();
	},

	hide: function() {
		$tooltip = this.$el;
		$tooltip.hide();
	},

	message: function(data) {
		var format = d3.format(",d")
		msg = data.nombre;
		return msg
	},


	render: function() {
		$tooltip = this.$el
		$tooltip.hide();
		$tooltip.attr("style", "background:#ffff99;width:350px;position:absolute;z-index:9999;border-radius:8px");

		$tooltipcontent = $("<div>")
			.attr("class", "tooltipcontent")
			.attr("style", "padding:4px;border:1px solid");

		$tooltip.append($tooltipcontent);
		$tooltip.appendTo($("body"));

		this.hide();

		return this;
	}
});


