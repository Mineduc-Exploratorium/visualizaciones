// VistaEjesXY
// ============
// Crea un ejes horizontal & vertical (X & Y) data las escalas (d3.scale) y los textos de los ejes.
//
// el:  elemento svg en el cual se incorporará la leyenda (si se omite se crea un elemento <g></g>)
//
var VistaEjesXY = Backbone.View.extend({
	tagName: "g",

	initialize : function(options) {
		// Si no viene parámetro el, es necesario crear un nuevo elemento en el namespace de SVG (no basta this.$el)
		this.svg = (options && options.svg) ? options.svg : document.createElementNS('http://www.w3.org/2000/svg', this.tagName);
		this.x = (options && options.x) ? options.x : d3.scale();
		this.y = (options && options.y) ? options.y : d3.scale();
		this.height = (options && options.height) ? options.height : 500;
		this.width = (options && options.width) ? options.width : 500;
		this.labelX = (options && options.labelX) ? options.labelX : "X";
		this.labelY = (options && options.labelY) ? options.labelY : "Y";

		this.render();
	},

	show: function() {
		d3.select(this.el).attr("opacity", 1);
	},

	hide: function() {
		d3.select(this.el).attr("opacity", 0);
	},

	redraw: function() {
		this.xAxis
		    .scale(this.x)

		this.yAxis
		    .scale(this.y)

		this.d3el
			.select(".axis.x")
				.call(this.xAxis)
			.select("text.label")
				.text(this.labelX);

		this.d3el
			.select(".axis.y")
				.call(this.yAxis)
			.select("text.label")
				.text(this.labelY);
	},

	render: function() {
		this.d3el = this.svg
			.append("g");

		this.el = this.d3el[0][0];

		this.xAxis = d3.svg.axis()
		    .scale(this.x)
		    .orient("bottom");

		this.yAxis = d3.svg.axis()
		    .scale(this.y)
		    .orient("left");

		this.d3el.append("g")
		  .attr("class", "x axis")
		  .attr("transform", "translate(0," + this.height + ")")
		  .attr("opacity",1)
		  .call(this.xAxis)
		.append("text")
		  .attr("class", "label")
		  .attr("x", this.width)
		  .attr("y", -6)
		  .style("text-anchor", "end")
		  .text(this.labelX);

		this.d3el.append("g")
		  .attr("class", "y axis")
		  .call(this.yAxis)
		  .attr("opacity",1)
		.append("text")
		  .attr("class", "label")
		  .attr("transform", "rotate(-90)")
		  .attr("y", 6)
		  .attr("dy", ".71em")
		  .style("text-anchor", "end")
		  .text(this.labelY)


		this.show();
		return this
	}

});