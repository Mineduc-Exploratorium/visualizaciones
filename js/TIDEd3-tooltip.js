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
<<<<<<< HEAD
	show: function(data, pos) {
		console.log(data);
=======
	show: function(data) {
>>>>>>> b8724f62a810f17ede2e1558bb0e27be290ca7c0
		$tooltip = this.$el;
		$tooltipcontent = $tooltip.find(".tooltipcontent")

		$tooltipcontent.html(this.message(data));
		
		var pos = {x:d3.event.pageX-$("body").offset().left, y:d3.event.pageY}


		// Chequea si tooltip queda fuera del área visible
		//var posY = pos.y-$(window).scrollTop() + $tooltip.height() < +$(window).height() ? pos.y +10 : $(window).height() + $(window).scrollTop() - $tooltip.height() -10 ;
		//var posX = pos.x > 0 ? pos.x+10 : 0 ;
		//var posX = pos.x > $(window).width()-$tooltip.width() ? $(window).width()-$tooltip.width() : pos.x+10 ;

		var newpos = this.tooltipPosition(pos.x, pos.y);

<<<<<<< HEAD
		$tooltipcontent.html(this.message(data));
		// PRUEBA
		// var msg = "Pos Y : " +pos.y;
		// msg += "<br>Scroll Y : " + $(window).scrollTop();
		// msg += "<br>Window H : " + $(window).height();
		// msg += "<br>Distacia Piso : " + (+$(window).height()-(+pos.y-$(window).scrollTop())) ;
		// msg += "<br>Mi alto : " + $tooltip.height();

		

		// Recuerda la mayor altura del tooltip para evitar saltos erráticos
		this.myHeight = $tooltip.height() > this.myHeight ? $tooltip.height() : this.myHeight;
=======

		$tooltip.css({"top":newpos.y, "left":newpos.x});
>>>>>>> b8724f62a810f17ede2e1558bb0e27be290ca7c0

		$tooltip.show();
	},

	tooltipPosition: function(mouseX, mouseY) {
		var windowH = $(window).height();
		var windowW = $(window).width();
		var scrollH = $(window).scrollTop();
		var offsetV = $("body").offset().left;
		var tooltipH = this.$el.height();
		var tooltipW = this.$el.width();

		var posX = mouseX > (windowW-tooltipW-offsetV) ? windowW-tooltipW-offsetV : mouseX+10;

		if ((mouseY+tooltipH-scrollH) < windowH) {
			posY = mouseY + 10;
		} else {
			posY = windowH-tooltipH+scrollH-10;
			posX = posX<(windowW-tooltipW-offsetV) ? posX : mouseX-tooltipW -10;
		}

		return {x:posX, y:posY};
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
		
		$tooltip.attr("style", "background:#ffff99;width:350px;position:absolute;z-index:9999;border-radius: 8px;opacity:0.9;");

		$tooltip.hide();

		$tooltipcontent = $("<div>")
			.attr("class", "tooltipcontent")
			.attr("style", "padding:4px;");

		$tooltip.append($tooltipcontent);
		$tooltip.appendTo($("body"));

		return this;
	}
});
