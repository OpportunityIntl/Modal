(function($) {
  $.lightbox = function(selector, options) {
    return new Lightbox(selector, options);
  };
  
  var Lightbox = function(selector, options) {
    var _this = this;
    var items = null;
    var currentItem = null;
    var prevTrigger = null;
    var nextTrigger = null;
    
    this.trigger = $(selector);
    this.modal = null;
    this.options = $.extend({
      aboveContent: '',
      belowContent: ''
    }, options);
    
    this.next = function() {
      var currentIndex = items.index(currentItem);
      if (currentIndex < items.length - 1) {
        currentItem = items.eq(currentIndex + 1);
        
        var loadingTimeout = setTimeout(function() {
          _this.modal.element.find('.modal-container').addClass('loading');
        }, 200);
        
        preloadImage(currentItem.attr('href'), function(image) {
          _this.modal.update(generateContent(image, currentItem), function(modal) {
            clearTimeout(loadingTimeout);
            fitToScreen();
            modal.find('.modal-container').removeClass('loading');
          });
        });
      }
    };
    
    this.prev = function() {
      var currentIndex = items.index(currentItem);
      if (currentIndex > 0) {
        currentItem = items.eq(currentIndex - 1);
        
        var loadingTimeout = setTimeout(function() {
          _this.modal.element.find('.modal-container').addClass('loading');
        }, 200);
        
        preloadImage(currentItem.attr('href'), function(image) {
          _this.modal.update(generateContent(image, currentItem), function(modal) {
            clearTimeout(loadingTimeout);
            fitToScreen();
            modal.find('.modal-container').removeClass('loading');
          });
        });
      }
    };
    
    this.trigger.click(openHandler);
    $(window).on('resize.lightbox', function() {
      if (_this.modal) fitToScreen();
    });
    
    function generateContent(img, trigger) {
      var aboveContent = typeof _this.options.aboveContent === 'function' ? _this.options.aboveContent.call(trigger, items.index(trigger), items) : _this.options.aboveContent;
      var belowContent = typeof _this.options.belowContent === 'function' ? _this.options.belowContent.call(trigger, items.index(trigger), items) : _this.options.belowContent;
      var imageContainer = $('<div>', {class: 'lightbox-image'});
      var image = $(img);
      var loadingIndicator = $('<div class="loading-container"><div class="loading-indicator"></div></div>');
      
      image.attr('width', image.prop('naturalWidth'));
      image.attr('height', image.prop('naturalHeight'));
      
      nextTrigger = $('<button>', {type: 'button', class: 'reset lightbox-next icon-arrow-right-small'});
      prevTrigger = $('<button>', {type: 'button', class: 'reset lightbox-prev icon-arrow-left-small'});
      
      // add previous icon, if necessary
      if (items.index(trigger) > 0) {
        imageContainer.append(prevTrigger);
      }
      
      // add image
      imageContainer.append(image.addClass('block'));
      
      // add previous icon, if necessary
      if (items.index(trigger) < items.length - 1) {
        imageContainer.append(nextTrigger);
      }
      
      // add loading indicator
      imageContainer.append(loadingIndicator);
      // attach event handlers to navigation icons
      prevTrigger.on('click.lightbox', function() {
        _this.prev();
      });
      nextTrigger.on('click.lightbox', function() {
        _this.next();
      });
      
      // put it all together;
      var content = $('<div>', {class: 'lightbox-container'}).append($(aboveContent), imageContainer, $(belowContent));
      
      return content;
    }
    
    function preloadImage(source, callback) {
      var image = new Image();
      $(image).on('load', function() {
        if (typeof callback === 'function') callback.call(null, image);
      });
      image.src = source;
    }
    
    function fitToScreen() {
      _this.modal.element.addClass('size');
      
      var modal = _this.modal.element.find('.modal-container'),
          image = modal.find('.lightbox-image img');
      
      modal.css('max-width', '');
      
      var modalHeight = modal.outerHeight(),
          imageHeight = image.outerHeight(),
          imageNaturalWidth = image.prop('naturalWidth'),
          imageRatio =  image.prop('naturalWidth') / image.prop('naturalHeight'),
          maxHeight = $(window).height() - 40;
      
      if (modalHeight > maxHeight) {
        var fullWidth = (maxHeight - (modalHeight - imageHeight)) * imageRatio;
        modal.css('max-width', Math.min(fullWidth, imageNaturalWidth) + 'px');
      } else {
        modal.css('max-width', imageNaturalWidth + 'px');
      }
      
      _this.modal.element.removeClass('size');
    }
    
    function openHandler() {
      var rel = $(this).attr('rel');
      currentItem = $(this);
      items = $(selector + (rel ? '[rel="' + rel + '"]' : ''));
      
      _this.modal = new Modal(null, {
        content: '<div class="loading-container"><div class="loading-indicator"></div></div>',
        classes: 'lightbox loading hide-close',
        afterClose: closeHandler
      }).open();
      
      preloadImage(currentItem.attr('href'), function(image) {
        setTimeout(function() {
          _this.modal.update(generateContent(image, currentItem), function(modal) {
            fitToScreen();
            modal.find('.modal-container').removeClass('loading hide-close');
          });
        }, 600);
        
        $(document).bind('keyup.lightbox', function(e) {
          if (e.keyCode === 39) {
            _this.next();
          } else if (e.keyCode === 37) {
            _this.prev();
          }
        });
      });
      
      return false;
    }
    
    function closeHandler() {
      items = null;
      currentItem = null;
      prevTrigger.off('click.lightbox');
      nextTrigger.off('click.lightbox');
      prevTrigger = null;
      nextTrigger = null;
      _this.modal = null;
      
      $(document).unbind('keyup.lightbox');
    }
  };

  window.Lightbox = Lightbox;
}(jQuery));
