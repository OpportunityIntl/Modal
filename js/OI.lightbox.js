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
        preloadImage(currentItem.attr('href'), function() {
          _this.modal.update(generateContent(currentItem), fitToScreen);
        });
      }
    };
    
    this.prev = function() {
      var currentIndex = items.index(currentItem);
      if (currentIndex > 0) {
        currentItem = items.eq(currentIndex - 1);
        preloadImage(currentItem.attr('href'), function() {
          _this.modal.update(generateContent(currentItem), fitToScreen);
        });
      }
    };
    
    this.trigger.click(openHandler);
    $(window).on('resize.lightbox', function() {
      if (_this.modal) fitToScreen();
    });
    
    function generateContent(trigger) {
      var aboveContent = typeof _this.options.aboveContent === 'function' ? _this.options.aboveContent.call(trigger, items.index(trigger), items) : _this.options.aboveContent;
      var belowContent = typeof _this.options.belowContent === 'function' ? _this.options.belowContent.call(trigger, items.index(trigger), items) : _this.options.belowContent;
      var imageContainer = $('<div>', {class: 'lightbox-image'});
      var image = $('<img>', {src: trigger.attr('href'), class: 'block'});
      
      nextTrigger = $('<button>', {type: 'button', class: 'reset lightbox-next icon-arrow-right-small'});
      prevTrigger = $('<button>', {type: 'button', class: 'reset lightbox-prev icon-arrow-left-small'});
      
      // add previous icon, if necessary
      if (items.index(trigger) > 0) {
        imageContainer.append(prevTrigger);
      }
      
      // add image
      imageContainer.append(image);
      
      // add previous icon, if necessary
      if (items.index(trigger) < items.length - 1) {
        imageContainer.append(nextTrigger);
      }
      
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
      image.src = source;
      $(image).on('load', function() {
        if (typeof callback === 'function') callback.call();
      });
    }
    
    function fitToScreen() {
      _this.modal.element.addClass('size');
      
      var modal = _this.modal.element.find('.modal-container'),
          image = modal.find('.lightbox-image img');
      
      modal.css('max-width', '');
      
      var modalHeight = modal.outerHeight(),
          imageHeight = image.outerHeight(),
          imageNaturalWidth = image.prop('naturalWidth'),
          imageRatio =  image.outerWidth() / imageHeight,
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
      
      preloadImage(currentItem.attr('href'), function() {
        _this.modal = new Modal(null, {
          content: generateContent(currentItem, items),
          classes: 'lightbox',
          afterClose: closeHandler
        }).create();
        
        fitToScreen();
        _this.modal.open();
        
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
