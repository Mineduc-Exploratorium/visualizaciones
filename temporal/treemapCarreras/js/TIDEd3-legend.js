// VistaLeyendaSVG
// ===============
// Crea un cuadro de leyenda con códigos de colores asociados a grupos.  Se genera un cuadro con cada color y un texto que le 
// acompaña (en forma vertical).
//
// scale: escala ordinal con la definición de la leyenda
// width: ancho de la leyenda (se alinea a la derecha)
// el:  elemento svg en el cual se incorporará la leyenda (si se omite se crea un elemento <g></g>)
//
var VistaLeyendaSVG = Backbone.View.extend({
	tagName: "g",

	initialize : function(options) {
		// Si no viene parámetro el, es necesario crear un nuevo elemento en el namespace de SVG (no basta this.$el)
		this.svg = (options && options.svg) ? options.svg : document.createElementNS('http://www.w3.org/2000/svg', this.tagName);
		this.scale = (options && options.scale) ? options.scale : d3.scale.ordinal();
		this.left = (options && options.left) ? options.left : 800;
		this.top = (options && options.top) ? options.top : 0;
		this.render();
	},

	redraw: function() {

	},

	render: function() {
		var self = this;

		this.d3el = this.svg.append("g");
		this.el = this.d3el[0];

		// Ubicar el elemento en la posición top, left (esquina superior derecha de leyenda)
		this.d3el.attr("transform", "translate(" + this.left + ","+this.top+")");

		var range = this.scale.range();
		var domain = this.scale.domain();

		var legend = this.d3el.selectAll(".legend")
		  	.data(this.scale.domain())
			.enter()
				.append("g")
		  		.attr("class", "legend")
		  		.attr("transform", function(d, i) { return "translate(0," + i * 20  + ")"; });

		legend.append("rect")
		  .attr("x", - 18)
		  .attr("width", 18)
		  .attr("height", 18)
		  .attr("stroke", "lightblue")
		  .style("fill", function(d) {return self.scale(d)});

		legend.append("text")
		  .attr("x",  - 24)
		  .attr("y", 9)
		  .attr("dy", ".35em")
		  .style("text-anchor", "end")
		  .text(function(d) { return d; });
		
		return this
	}

});
