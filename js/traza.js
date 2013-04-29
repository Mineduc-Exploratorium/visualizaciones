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
    	this.height = 600 - this.margin.top - this.margin.bottom;

		// Vista con tooltip para mostrar datos del item respectivo
		//this.tooltip = new VistaToolTip();
		this.tooltip = new VistaToolTip();
		this.tooltip.message = this.tootipMessage;

	
    	// Carga de datos
    	//
		this.$el.append("<progress id='progressbar'></progress>");
		d3.tsv("data/flujo_links.txt", function(data) {
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
		var formatNumber = d3.format(",.0f");

		var msg = "";
		// Chequar si es un link (contiene source & target)
		if (data.source) {
			msg += "<span class='text-info'>"+data.source.name+" -> "+data.target.name+"</span>";
			msg += "<br>"+formatNumber(data.value)+" estudiantes.";

		} else {
			msg += "<span class='text-info'>"+data.name+"</span>";
			msg += "<br>"+formatNumber(data.value)+" estudiantes.";
		}

		return msg;
	},


	render: function() {
		self = this; // Para hacer referencia a "this" en callback functions

		// Se entrega como insumo la lista de links con atributos:
		// - source (Ej. "Municipal 2009")
		// - target (Ej. "Subvencionado 2010")
		// - value  (Ej. "12342")
		this.links = this.data;

		// Se genera la lista de nodos a partir de los nombres de nodos en los links (source & target)
		this.nodeNames = {}; // diccionario con nombres de nodos (uso auxiliar)
		_.each(this.links, function(linkItem) {
			self.nodeNames[linkItem.source]="dummy";
			self.nodeNames[linkItem.target]="dummy";
		});
		this.nodes = _.map(_.keys(self.nodeNames), function(nodeName) {
			return  {name: nodeName};
		});

		// Genera objeto con datos que son insumos de diagrama de flujo
		this.flowData = {nodes:this.nodes, links:this.links};


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
		this.flowData.nodes.forEach(function(d) { nodeMap[d.name] = d; });
		this.flowData.links = this.flowData.links.map(function(x) {
		  return {
		    source: nodeMap[x.source],
		    target: nodeMap[x.target],
		    value: x.value
		  };
		});


		sankey
		  .nodes(this.flowData.nodes)
		  .links(this.flowData.links)
		  .layout(32);

		// add in the links
		var link = svg.append("g").selectAll(".link")
		  .data(this.flowData.links)
		.enter().append("path")
		  .attr("class", "link")
		  .attr("d", path)
		  .style("stroke-width", function(d) { return Math.max(1, d.dy); })
		  .sort(function(a, b) { return b.dy - a.dy; })
		  .on("mouseover", function(d) {
				self.tooltip.show(d);
			})			
		  .on("mouseout", function(d) {
				self.tooltip.hide();
			})


		// add in the nodes
		var node = svg.append("g").selectAll(".node")
		  .data(this.flowData.nodes)
		.enter().append("g")
		  .attr("class", "node")
		  .attr("transform", function(d) { 
			  return "translate(" + d.x + "," + d.y + ")"; })
			.call(d3.behavior.drag()
			  .origin(function(d) { return d; })
			  .on("dragstart", function() { 
				  this.parentNode.appendChild(this); })
			  .on("drag", dragmove))
			.on("mouseover", function(d) {
				pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}
				self.tooltip.show(d, pos);
			})			
			.on("mouseout", function(d) {
				self.tooltip.hide();
			})

		// add the rectangles for the nodes
		node.append("rect")
		  .attr("height", function(d) { return d.dy; })
		  .attr("width", sankey.nodeWidth())
		  .style("fill", function(d) { 
		  	
		  return d.color = color(d.name.replace(/ .*/, "")); })


		  .style("stroke", function(d) { 
			  return d3.rgb(d.color).darker(2); })


		// add in the title for the nodes
		node.append("text")
		  .attr("x", -6)
		  .attr("y", function(d) { return d.dy / 2; })
		  .attr("dy", ".35em")
		  .attr("text-anchor", "end")
		  .attr("transform", null)
		  .text(function(d) { return d.name; })
		.filter(function(d) { return d.x < self.width / 2; })
		  .attr("x", 6 + sankey.nodeWidth())
		  .attr("text-anchor", "start");

		// the function for moving the nodes
		function dragmove(d) {
		d3.select(this).attr("transform", 
		    "translate(" + d.x + "," + (
		            d.y = Math.max(0, Math.min(self.height - d.dy, d3.event.y))
		        ) + ")");
		sankey.relayout();
		link.attr("d", path);
		}


	}

});
