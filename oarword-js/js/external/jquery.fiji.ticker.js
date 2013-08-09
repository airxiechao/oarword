/*!
 * jQuery Fiji Ticker @VERSION
 *
 * Copyright (c) 2011 Kai Schlamp, Torsten Kühr
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * https://github.com/medihack/jquery-fiji
 *
 * Depends:
 *   jquery.ui.core.js
 *   jquery.ui.widget.js
 */
(function($, undefined) {
	
$.widget("fiji.ticker", {
	options: {
		active: true,
		initialTimeout: 4000,
		mouseOnTimeout: 8000,
		mouseOffTimeout: 4000,
		scrollTime: 800,
		fadeTime: 1000,
        fixContainer: false,
		next: function(lastItem, nextItem) { nextItem(lastItem); }
	},
	
	_create: function() {
		var self = this,
			options = self.options;
			
		self.timeoutId = null;
			
		self.speed = options.mouseOffTimeout;
		
		self.element
			.addClass("fiji-ticker")
			.bind("mouseenter.ticker", function() {
				if (options.disabled) {
					return;
				}
				self.speed = options.mouseOnTimeout;
				if (options.active && self.timeoutId !== null) {
					window.clearTimeout(self.timeoutId);
					self.timeoutId = window.setTimeout(function() {self._scroll();}, self.speed);
				}
			})
			.bind("mouseleave.ticker", function() {
				if (options.disabled) {
					return;
				}
				self.speed = options.mouseOffTimeout;
				if (options.active && self.timeoutId !== null) {
					window.clearTimeout(self.timeoutId);
					self.timeoutId = window.setTimeout(function() {self._scroll();}, self.speed);
				}
			});

		self._addItemBindings(self.element.children("li"));

		var style = self.element.attr("style");
		if (style === undefined || style === null) {
			self.originalStyle = null;
		}
		else {
			self.originalStyle = self.element.attr("style")
		}

        if (options.fixContainer) {
          self.element.height(self.element.height());
          self.element.css("overflow", "hidden");
        }
	},
	
	_init: function() {
		var self = this,
			options = self.options;

		self.readyForNext = true;
			
		if (options.active) {
			self.timeoutId = window.setTimeout(function() {self._scroll()}, options.initialTimeout);
		}
	},

	destroy: function() {
		var self = this;

		if (self.timeoutId !== null) {
			window.clearTimeout(self.timeoutId);
			self.timeoutId = null;
		}
		
		self.element.unbind(".ticker");
		self.element.children("li").unbind(".ticker");
		self.element.removeClass("fiji-ticker");

		if (self.originalStyle === null) {
			self.element.removeAttr("style");
		}
		else {
			self.element.attr("style", self.originalStyle);
		}

		return $.Widget.prototype.destroy.call(self);
	},
	
	_addItemBindings: function(item) {
		var options = this.options;
		
		item.bind("mouseenter.ticker", function() {
			if (options.disabled) {
				return;
			}
		})
		.bind("mouseleave.ticker", function() {
			if (options.disabled) {
				return;
			}
		})
		.bind("focus.ticker", function() {
			if (options.disabled) {
				return;
			}
		})
		.bind("blur.ticker", function() {
			if (options.disabled) {
				return;
			}
		});
	},
	
	_scroll: function() {
		var self = this,
			options = self.options;
			
		if (self.options.next !== null && self.readyForNext) {
			var lastItem = self.element.children("li").last().clone(true);
			self.readyForNext = false;
			var nextItem = self.options.next(lastItem, function() {
				self._nextItem.apply(self, arguments);
			});
			if (nextItem) {
				self._nextItem(nextItem);
			}
		}
		
		if (options.active) {
			self.timeoutId = window.setTimeout(function() {self._scroll();}, self.speed);
		}
	},

    _nextItem: function(nextItem) {
		var self = this,
			options = self.options;

		if (nextItem != null && nextItem.length > 0) {
			self._trigger('beforeScroll');

			var $nextItem = $(nextItem);

			self._addItemBindings($nextItem);
			$nextItem
				.hide()
				.prependTo(self.element)
				.css('visibility', 'hidden')
				.slideDown(options.scrollTime, function() {
					$(this)
						.fadeTo(0, 0)
						.css('visibility', 'visible')
						.fadeTo(options.fadeTime, 1, function() {
							self._trigger('afterFade');
						});
						self.element.children("li").last().remove();
						self.readyForNext = true;
						self._trigger('afterScroll');
				});
		}
		else {
			self.readyForNext = true;
		}
    },
	
	_setOption: function(key, value) {
		$.Widget.prototype._setOption.apply(this, arguments);
		
		switch (key) {
			case "active":
				if (value) {
					this.start();
				}
				else {
					this.stop();
				}
				break;
		}
	},
	
	stop: function() {
		var self = this,
			options = self.options;
			
		options.active = false;	
		if (self.timeoutId !== null) {
			window.clearTimeout(self.timeoutId);
			self.timeoutId = null;
		}
 	},
 	
 	start: function() {
		var self = this,
			options = self.options;
		
		options.active = true;
		if (self.timeoutId === null) {
			self.timeoutId = window.setTimeout(function() {self._scroll();}, options.initialTimeout);
		}
	}
});

$.extend($.fiji.ticker, {
	version: "@VERSION"
});

})(jQuery);
