$().ready(function() {
	vista = new VistaPrincipal({el:"#mainchart"});
});

// VistaPrincipal
// ===================
// Vista principal con datos de ...
//
var VistaPrincipal = Backbone.View.extend({
	el:"body",
	
	initialize: function() {
		_.bindAll(this,"render")
		self= this; // Alias a this para ser utilizado en callback functions

		this.margin = {top: 20, right: 20, bottom: 30, left: 100},
    	this.width = 800 - this.margin.left - this.margin.right,
    	this.height = 400 - this.margin.top - this.margin.bottom;

		// Vista con tooltip para mostrar datos del item
		this.tooltip = new VistaToolTip();
		this.tooltip.message = this.tootipMessage;
 
    	// Carga de datos
    	//
		this.$el.append("<progress id='progressbar'></progress>");
		d3.json("data/data.json", function(data) {
			$("#progressbar").hide(); // Ocultar barra de progreso

			self.data = data;
			self.render();
		});
	},

	// tooltipMessage
	// --------------
	// Genera el texto (html) que se desplegará en el tooltip
	// utilizando datos del objeto "data"  (Ej. data = {nombre:"Juan"})
	tootipMessage: function(data) {
		// Atributos
		// CODIGO_UNICO	TIPO_INSTITUCION	INSTITUCION	SEDE	REGION	CARRERA	HORARIO	NOTAS_EM	PRUEBA_LENGUAJE	PRUEBA_MATEMATICAS	PRUEBA_HISTORIA	PRUEBA_CIENCIAS	OTROS	VACANTES_PRIMER_SEMESTRE	VACANTES_SEGUNDO_SEMESTRE	VALOR_MATRICULA	VALOR_ARANCEL	DURACION_SEMESTRES	AREA	ACREDITACION_CARRERA
		var msg = "<span class='text-info'>"+data.CARRERA+"</span>";
		msg += "<br>"+ data.INSTITUCION;
		msg += "<br>Sede: "+ data.SEDE;
		msg += "<br>Horario: "+ data.HORARIO;
		msg += "<br>Horario: "+ data.ACREDITACION_CARRERA;
		return msg;
	},


	render: function() {
		self = this; // Para hacer referencia a "this" en callback functions

		var units = "Estudiantes";

		var formatNumber = d3.format(",.0f"),    // zero decimal places
		    format = function(d) { return formatNumber(d) + " " + units; },
		    color = d3.scale.category20();

		// append the svg canvas to the page
		var svg = d3.select(this.el).append("svg")
		    .attr("width", this.width + this.margin.left + this.margin.right)
		    .attr("height", this.height + this.margin.top + this.margin.bottom)
		  .append("g")
		    .attr("transform", 
		          "translate(" + this.margin.left + "," + this.margin.top + ")");

		// Set the sankey diagram properties
		var sankey = d3.sankey()
		    .nodeWidth(36)
		    .nodePadding(10)
		    .size([this.width, this.height]);

		var path = sankey.link();

		var nodeMap = {};
		this.data.nodes.forEach(function(x) { nodeMap[x.name] = x; });
		this.data.links = this.data.links.map(function(x) {
		  return {
		    source: nodeMap[x.source],
		    target: nodeMap[x.target],
		    value: x.value
		  };
		});

		sankey
		  .nodes(this.data.nodes)
		  .links(this.data.links)
		  .layout(32);

		// add in the links
		var link = svg.append("g").selectAll(".link")
		  .data(this.data.links)
		.enter().append("path")
		  .attr("class", "link")
		  .attr("d", path)
		  .style("stroke-width", function(d) { return Math.max(1, d.dy); })
		  .sort(function(a, b) { return b.dy - a.dy; });

		// add the link titles
		link.append("title")
		    .text(function(d) {
				return d.source.name + " → " + 
		            d.target.name + "\n" + format(d.value); });

		// add in the nodes
		var node = svg.append("g").selectAll(".node")
		  .data(this.data.nodes)
		.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { 
			  return "translate(" + d.x + "," + d.y + ")"; })
		.call(d3.behavior.drag()
		  .origin(function(d) { return d; })
		  .on("dragstart", function() { 
			  this.parentNode.appendChild(this); })
		  .on("drag", dragmove));

		// add the rectangles for the nodes
		node.append("rect")
		  .attr("height", function(d) { return d.dy; })
		  .attr("width", sankey.nodeWidth())
		  .style("fill", function(d) { 
		  	
		  return d.color = color(d.name.replace(/ .*/, "")); })


		  .style("stroke", function(d) { 
			  return d3.rgb(d.color).darker(2); })
		.append("title")
		  .text(function(d) { 
			  return d.name + "\n" + format(d.value); });

		// add in the title for the nodes
		node.append("text")
		  .attr("x", -6)
		  .attr("y", function(d) { return d.dy / 2; })
		  .attr("dy", ".35em")
		  .attr("text-anchor", "end")
		  .attr("transform", null)
		  .text(function(d) { return d.name; })
		.filter(function(d) { return d.x < width / 2; })
		  .attr("x", 6 + sankey.nodeWidth())
		  .attr("text-anchor", "start");

		// the function for moving the nodes
		function dragmove(d) {
		d3.select(this).attr("transform", 
		    "translate(" + d.x + "," + (
		            d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
		        ) + ")");
		sankey.relayout();
		link.attr("d", path);
		}



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

/*

<script>
  
var units = "Estudiantes";

var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scale.category20();

// append the svg canvas to the page
var svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

// Set the sankey diagram properties
var sankey = d3.sankey()
    .nodeWidth(36)
    .nodePadding(10)
    .size([width, height]);

var path = sankey.link();

// load the data
d3.json("data.json", function(error, graph) {

    var nodeMap = {};
    graph.nodes.forEach(function(x) { nodeMap[x.name] = x; });
    graph.links = graph.links.map(function(x) {
      return {
        source: nodeMap[x.source],
        target: nodeMap[x.target],
        value: x.value
      };
    });

  sankey
      .nodes(graph.nodes)
      .links(graph.links)
      .layout(32);

// add in the links
  var link = svg.append("g").selectAll(".link")
      .data(graph.links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", path)
      .style("stroke-width", function(d) { return Math.max(1, d.dy); })
      .sort(function(a, b) { return b.dy - a.dy; });

// add the link titles
  link.append("title")
        .text(function(d) {
    		return d.source.name + " → " + 
                d.target.name + "\n" + format(d.value); });

// add in the nodes
  var node = svg.append("g").selectAll(".node")
      .data(graph.nodes)
    .enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { 
		  return "translate(" + d.x + "," + d.y + ")"; })
    .call(d3.behavior.drag()
      .origin(function(d) { return d; })
      .on("dragstart", function() { 
		  this.parentNode.appendChild(this); })
      .on("drag", dragmove));

// add the rectangles for the nodes
  node.append("rect")
      .attr("height", function(d) { return d.dy; })
      .attr("width", sankey.nodeWidth())
      .style("fill", function(d) { 
      	*/
//OJO		  return d.color = color(d.name.replace(/ .*/, "")); })

/*
      .style("stroke", function(d) { 
		  return d3.rgb(d.color).darker(2); })
    .append("title")
      .text(function(d) { 
		  return d.name + "\n" + format(d.value); });

// add in the title for the nodes
  node.append("text")
      .attr("x", -6)
      .attr("y", function(d) { return d.dy / 2; })
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .attr("transform", null)
      .text(function(d) { return d.name; })
    .filter(function(d) { return d.x < width / 2; })
      .attr("x", 6 + sankey.nodeWidth())
      .attr("text-anchor", "start");

// the function for moving the nodes
  function dragmove(d) {
    d3.select(this).attr("transform", 
        "translate(" + d.x + "," + (
                d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
            ) + ")");
    sankey.relayout();
    link.attr("d", path);
  }
});
*/
