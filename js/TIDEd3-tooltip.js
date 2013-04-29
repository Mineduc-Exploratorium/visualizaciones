// VistaTool
// ----------------------------
// Muestra tooltip con mini ficha del item (se ubica al hacer rollover sobre el establecimiento)
var VistaToolTip = Backbone.View.extend({

	initialize: function() {
		this.myHeight = 0;
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
		console.log(data);
		$tooltip = this.$el;
		$tooltipcontent = $tooltip.find(".tooltipcontent")





		$tooltipcontent.html(this.message(data));
		// PRUEBA
		// var msg = "Pos Y : " +pos.y;
		// msg += "<br>Scroll Y : " + $(window).scrollTop();
		// msg += "<br>Window H : " + $(window).height();
		// msg += "<br>Distacia Piso : " + (+$(window).height()-(+pos.y-$(window).scrollTop())) ;
		// msg += "<br>Mi alto : " + $tooltip.height();

		

		// Recuerda la mayor altura del tooltip para evitar saltos erráticos
		this.myHeight = $tooltip.height() > this.myHeight ? $tooltip.height() : this.myHeight;


		// Chequea si tooltip queda fuera del borde izquierdo
		var posX = pos.x-$tooltip.width()/2 > 0 ? pos.x-$tooltip.width()/2 : 0 ;

		var distanciaAlPiso = (+$(window).height()-(+pos.y-$(window).scrollTop()));
		var miAlto = this.myHeight+40;

		var posY;
		if (distanciaAlPiso < miAlto) {
			posY = pos.y - miAlto;
		} else {
			posY = pos.y+10;
		}

		$tooltip.css({"top":posY, "left":posX});

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
