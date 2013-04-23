// VistaTool
// ----------------------------
// Muestra tooltip con mini ficha del item (se ubica al hacer rollover sobre el establecimiento)
var VistaToolTip = Backbone.View.extend({

	initialize: function() {
		this.render()
	},

	// show
	// ----
	// Genera el menaje a mostrar (de acuerdo a datos ingresados) y muestra el tooltip en la
	// posición indicada
	//
	// data: {nombre:"Escuela Arturo Prat", rbd: 123, ...}
	// pos : {x: 100, y: 250}
	show: function(data, pos) {
		$tooltip = this.$el;
		$tooltipcontent = $tooltip.find(".tooltipcontent")


		$tooltipcontent.html(this.message(data));

		// Chequea si tooltip queda fuera del borde izquierdo
		var posX = pos.x-$tooltip.width()/2 > 0 ? pos.x-$tooltip.width()/2 : 0 ;

		$tooltip.css({"top":pos.y+10, "left":posX});

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
		
		$tooltip.attr("style", "background:#ffff99;width:350px;position:absolute;z-index:9999;border-radius:8px");
		$tooltip.hide();

		$tooltipcontent = $("<div>")
			.attr("class", "tooltipcontent")
			.attr("style", "padding:4px;border:1px solid");

		$tooltip.append($tooltipcontent);
		$tooltip.appendTo($("body"));

		return this;
	}
});
