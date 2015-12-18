(function($) {
  $.fn.modal = function(options) {
    return this.each(function() {
      new Modal($(this), options);
    });
  };
  
  // Plugin defaults. Can be overriden or extended in your project to set different
  // defaults for all modals.
  $.fn.modal.defaults = {
    content: null,
    zIndex: 3,
    closeable: true,
    scrollFixClass: 'ios-scroll-container',
    beforeOpen: function() {},
    afterOpen: function() {},
    beforeClose: function() {},
    afterClose: function() {},
    fixedElements: []
  };
  
  // jQuery function to intitialize and open a modal programatically
  $.modal = function(options) {
    return new Modal(null, options).open();
  };
  
  // Array of modals that are currently open
  var openModals = [];
  
  // Current scrollTop of the body/window (used for iOS no-scroll fix)
  var bodyScrollTop = 0;
  
  // Define the Modal class
  var Modal = function(triggerClass, options) {
    // Cache reference to class instance
    var _this = this;
    
    /*********************
     * Public properties *
     *********************/
    
    // The element(s) that will trigger the modal on click
    this.trigger = $(triggerClass);
     
    // The modal element itself. Will be set/created later.
    this.element = null;
    
    // Default options that are based on data-attributes of trigger
    var dataAttributeDefaults = {
      classes: _this.trigger.data('modal-classes') || null,
      source: _this.trigger.data('modal') || null,
      type: _this.trigger.data('modal-type') || null,
    };
    
    // Extend default options with per-instance options
    this.options = $.extend({}, dataAttributeDefaults, $.fn.modal.defaults, options);
    
    // If content is declared as a function, execute it to get a string.
    this.content = typeof this.options.content === 'function'? this.options.content.call(this.trigger) : this.options.content;
    
    // The modal "type". Can be be 'url', 'video', 'content', or 'dynamic'. 
    this.type = this.options.type || determineType();
    
    // Save reference to openModals array for convenience
    this.openModals = openModals;
    
    /**********************
     * Private properties *
     **********************/
    
    // Boolean to identify iOS Safari for no-scroll fix. Checks for false
    // positives from Chrome for iOS and IE11 (apparently Microsoft
    // inserted 'iPhone' into the IE11 useragent string for some reason)
    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !/CriOS/.test(navigator.userAgent) && !window.MSStream;
    
    // Extend array of fixed elements that will be offset as part of scrollbar fix
    var fixedElements = $.merge([
      {
        element: $('.modal button.close.fixed'),
        property: 'right'
      }
    ], this.options.fixedElements);
    
    /*******************
     * Private methods *
     *******************/
    
    // Determines the modal type. For modal sources that are a
    // url, possible types are 'video' and 'url'. If modal source is not a url,
    // possible types are 'content' (meaning the modal markup already exists in 
    // the document) or 'dynamic' (meaning the modal will be generated and inserted)
    // into the document by this plugin).
    function determineType() {
      var type;
      
      if (isUrl()) {
        type = isVideo() ? 'video' : 'url';
      } else {
        type = existsInDOM() ? 'content' : 'dynamic';
      }
      
      return type;
    }
    
    // Determines if modal source is a url
    function isUrl() {
      return /^https?:\/\//.test(_this.options.source);
    }
     
    // Determines if modal source is a video
    function isVideo() {
      return /^https?:\/\/(www\.youtube|player\.vimeo)/.test(_this.options.source);
    }
    
    // Determines if modal source is an element and already in the DOM
    function existsInDOM() {
      return ($(_this.options.source).length > 0) ? true : false;
    }
    
    // Determines if modal is taller than the window and make
    // the modal scrollable
    function handleOverflow() {
      if (_this.element) {
        if (_this.element.find('.modal-container').outerHeight() + 40 >= $(window).height()) {
          _this.element.addClass('overflow');
        } else {
          _this.element.removeClass('overflow');
        }
      }
    }
    
    // Compensates for scrollbar width when modal is opened.
    // Without this, the page changes width and content shifts in browsers and
    // operating systems that display scrollbars.
    function addScrollbarFix() {
      // get total window width, including scrollbar
      var windowWidth = window.innerWidth;
      
      // IE8 workaround because window.innerWidth prop is missing
      if (!windowWidth) {
        var documentElementRect = document.documentElement.getBoundingClientRect();
        windowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
      }
      
      // calculate scrollbar width
      var scrollbarWidth = windowWidth - $('body').width();
      
      // add padding to account for space previously occupied by scrollbar
      if (iOS) {
        $('.' + _this.options.scrollFixClass).css('padding-right', scrollbarWidth);
      } else {
        $('body').css('padding-right', scrollbarWidth);
      }
      
      // adjust offset of fixed elements defined in options
      $.each(fixedElements, function(index, fixedElement) {
        if (typeof fixedElement.property === 'function') {
          fixedElement.property.call(fixedElement.element, scrollbarWidth);
        } else {
          fixedElement.originalValue = parseInt(fixedElement.element.css(fixedElement.property));
          fixedElement.element.css(fixedElement.property, fixedElement.originalValue + scrollbarWidth);
        }
      });
    }
    
    // Resets the scrollbar fix put in place to prevent content
    // shifts when modal is opened in browser and operating systems that
    // display scrollbars
    function removeScrollbarFix() {
      // remove extra padding added to account for scrollbar
      if (iOS) {
        $('.' + _this.options.scrollFixClass).css('padding-right', '');
      } else {
        $('body').css('padding-right', '');
      }
      
      // reset offset of fixed elements defined in options
      $.each(fixedElements, function(index, fixedElement) {
        if (typeof fixedElement.property === 'function') {
          fixedElement.property.call(fixedElement.element, 0);
        } else {
          fixedElement.element.css(fixedElement.property, fixedElement.originalValue || '');  
        }
      });
    }
    
    // Disables background scrolling. iOS Safari is a huge pain and requires
    // a messy workaround to disable background scrolling.
    function disableBackgroundScroll() {
      addScrollbarFix();
      if (iOS) {
        bodyScrollTop = $(window).scrollTop();
        $('body').addClass('ios-no-scroll');
        $('.' + _this.options.scrollFixClass).css('top', -bodyScrollTop);
      } else {
        $('body').addClass('no-scroll');
      }
    }
    
    // Reenables background scrolling.
    function enableBackgroundScroll() {
      removeScrollbarFix();
      if (iOS) {
        $('body').removeClass('ios-no-scroll');
        $(window).scrollTop(bodyScrollTop);
        $('.' + _this.options.scrollFixClass).css('top', 0);
      } else {
        $('body').removeClass('no-scroll');
      }
    }
    
    // Vertically center aligns the modal for browsers that don't support
    // CSS transformations
    function verticalCenterAlign() {
      if (_this.element) {
        var $modalContainer = _this.element.find('.modal-container');
        if (_this.element.hasClass('overflow')) {
          $modalContainer.css('margin-top', '');
        } else {
          $modalContainer.css('margin-top', -$modalContainer.height() / 2);
        }
      }
    }
    
    // Sets the z-index of the modal
    function setZIndex() {
      _this.element.css('z-index', _this.options.zIndex);
    }
    
    // Sets up the markup required to disable body scrolling in iOS Safari
    function setUpiOSfix() {
      if (iOS && $('.' + _this.options.scrollFixClass).length === 0) {
        $('body').wrapInner('<div class="' + _this.options.scrollFixClass + '">');
      }
    }
    
    // Gets the DOM object for the modal and stores it in the public element property
    function setElement() {
      var iframe;
      
      switch(_this.type) {
        case 'video':
        case 'url':
          // If the url is a video embed (YouTube or Vimeo), wrap the iframe in
          // Weavr's .flex-video class to make it responsive and force a 16:9 ratio.
          // If the url is not a video, wrap the iframe in generic .iframe class
          // to make it responsive and force a 4:3 ratio.
          _this.content = $('<div>', {class: _this.type === 'video' ? 'flex-video' : 'iframe'}).append($('<iframe>', {src: _this.trigger.data('modal'), frameborder: 0}));
          
          _this.element = createElement();
          break;
        case 'content':
          // if the modal source is a DOM object that already exists, use that
          _this.element = $(_this.options.source);
          
          break;
        case 'dynamic':
          // otherwise, create a new element
          _this.element = createElement();
          
          break;
      }
      
      _this.element.data('modal', _this);
    }
    
    // Creates the modal element and adds it to the document
    function createElement() {
      // create modal
      var $modal = $('<div>', {class: 'modal'});
      var $modalContainer = $('<div>', {class: 'modal-container'});
      var $modalContent = $('<div>', {class: 'modal-content'});
      var $modalCloseButton = $('<button>', {type: 'button', class: 'reset icon-cross close'});
      $modal.append($modalContainer.append([$modalCloseButton, $modalContent.append(_this.content)]));
      
      // add classes, if they exist, to the .modal div
      if (_this.options.classes) $modalContainer.addClass(_this.options.classes);
      
      // add modal element to the document
      $('body').append($modal);
      
      // flag modal element to be destroyed when closed
      $modal.data('destroyOnClose', true);
      
      return $modal;
    }
    
    // A few things that need to happen when the modal is initialized
    function initialize() {
      // Wrap the body content in a div for iOS Safari to disable body scroll
      setUpiOSfix();
      
      // When trigger is clicked, set/create the modal and open it
      _this.trigger.click(function() {
        _this.open();
        return false;
      });
      
      // When window is resized...
      $(window).resize(function() {
        // check if modal is taller than window and handle it if it is
        handleOverflow();
        
        // vertically center align modal if browser doesn't support CSS transformations
        if (!Modernizr.csstransforms) {
          verticalCenterAlign();
        }
      });
    }
    
    /******************
     * Public methods *
     ******************/
    
    // Opens the modal
    this.open = function() {
      setElement();
      
      _this.element.find('.modal-container').css({
        'transition-duration': '.5s, .3s',
        '-webkit-transition-duration': '.5s, .3s'
      });
      
      if (_this.options.beforeOpen.call(_this.element, _this) === false) {
        return false;
      }
      
      if (openModals.length === 0) {
        disableBackgroundScroll();
      }
      
      // if there's an open modal already, close it and add this modal
      // to the openModals array
      if (openModals.length > 0) openModals[openModals.length - 1].close();
      openModals.push(_this);
      
      if (!Modernizr.rgba) {
        _this.element.prepend($('<div>', {class: 'ie8-overlay'}));
      }
      
      setZIndex();
      
      // add class to body to start modal overlay animation
      _this.element.addClass('animate');
      
      // start modal animation shortly after overlay animation
      setTimeout(function() {
        handleOverflow();
        
        _this.element.addClass('show');
        
        if (!Modernizr.csstransforms) {
          verticalCenterAlign();
        }
      }, 100);
      
      setTimeout(function() {
        _this.element.find('.modal-container').css({
          'transition-duration': '',
          '-webkit-transition-duration': ''
        });
      }, 150);
      
      // close modal when any element inside the modal with a class
      // of 'close' is clicked
      _this.element.on('click.modal', '.close', function(e) {
        _this.close();
        e.stopPropagation();
      });
      
      // If the modal is configured to be closable, attach event handlers so
      // that modal can be closed by clicking outside of the modal or by
      // pressing the escape key. If it's not closeable, hide the close button
      // in the top righthand corner of the modal (if it already exists). Note
      // that any other element with a class of 'close' in the modal content
      // will still trigger the modal to close.
      if (_this.options.closeable) {
        // close modal when user clicks anywhere outside of modal
        _this.element.on('click.modal', function() {
          _this.close();
        });
        _this.element.on('click.modal', '.modal-container', function(e) {
          e.stopPropagation(); // this prevents a click on the actual modal from triggering close
        });
        
        // close modal with escape key
        $(document).bind('keyup.modal', function (e) {
          if (e.keyCode == '27') {
            _this.close();
          }
        });
      } else {
        // hide close button if it exists in the markup
        _this.element.find('button.close').hide();
      }
      
      // execute afterOpen callback after animation has finished
      setTimeout(function() {
        _this.options.afterOpen.call(_this.element, _this);
      }, 600);
      
      return _this;
    };
    
    // Closes the modal
    this.close = function() {
      if (_this.options.beforeClose.call(_this.element, _this) === false) {
        return false;
      }
      
      // remove from openModals array
      openModals.pop();
      
      // enable transition
      _this.element.find('.modal-container').css({
        'transition-duration': '.5s, .3s',
        '-webkit-transition-duration': '.5s, .3s'
      });
      
      // unbind event handlers that close the modal
      _this.element.off('click.modal');
      $(document).unbind('keyup.modal');
      
      // start close animation on modal
      _this.element.removeClass('show');
      
      // start close animation on modal overlay shortly afterward
      setTimeout(function() {
        if (openModals.length === 0) {
          enableBackgroundScroll();
        }
        
        _this.element.removeClass('animate');
        
        handleOverflow();
        
        if (!Modernizr.rgba) {
          _this.element.find('.ie8-overlay').remove();
        }
        
        _this.element.find('.modal-container').css({
          'transition-duration': '',
          '-webkit-transition-duration': ''
        });
        
        _this.options.afterClose.call(_this.element, _this);
        
        // if element was created dynamically, remove it on close
        if (_this.element.data('destroyOnClose')) {
          _this.element.remove();
        }
      }, 500);
      
      return _this;
    };
    
    this.update = function(content, callback) {
      _this.content = typeof content === 'function' ? content.call(_this, _this.element) : content;
      _this.element.find('.modal-content').html(_this.content);
      if (typeof callback === 'function') callback.call(_this, _this.element);
      handleOverflow();
      return _this;
    };
    
    /*********************************
     * Let's get this party started! *
     *********************************/
    initialize();
  };
  
  var Lightbox = function(triggerClass, options) {
    var _this = this;
    var images = null;
    var currentImage = null;
    
    this.trigger = $(triggerClass);
    this.modal = null;
    this.options = $.extend({
      aboveContent: '',
      belowContent: ''
    }, options);
    
    this.next = function() {
      var currentIndex = images.index(currentImage);
      if (currentIndex < images.length - 1) {
        currentImage = images.eq(currentIndex + 1);
        preloadImage(currentImage.attr('href'), function() {
          _this.modal.update(generateContent(currentImage));
        });
      }
    };
    
    this.prev = function() {
      var currentIndex = images.index(currentImage);
      if (currentIndex > 0) {
        currentImage = images.eq(currentIndex - 1);
        preloadImage(currentImage.attr('href'), function() {
          _this.modal.update(generateContent(currentImage));
        });
      }
    };
    
    this.trigger.click(openHandler);
    
    function generateContent(trigger) {
      var aboveContent = typeof _this.options.aboveContent === 'function' ? _this.options.aboveContent.call(trigger, images.index(trigger), images) : _this.options.aboveContent;
      var belowContent = typeof _this.options.belowContent === 'function' ? _this.options.belowContent.call(trigger, images.index(trigger), images) : _this.options.belowContent;
      var imageContainer = $('<div>', {class: 'lightbox-image'});
      var image = $('<img>', {src: trigger.attr('href'), class: 'block'});
      var nextTrigger = $('<button type="button" class="reset lightbox-next"><i class="icon-arrow-right-small"></i></button>');
      var prevTrigger = $('<button type="button" class="reset lightbox-prev"><i class="icon-arrow-left-small"></i></button>');
      
      // add previous icon, if necessary
      if (images.index(trigger) > 0) {
        imageContainer.append(prevTrigger);
      }
      
      // add image
      imageContainer.append(image);
      
      // add previous icon, if necessary
      if (images.index(trigger) < images.length - 1) {
        imageContainer.append(nextTrigger);
      }
      
      // put it all together;
      var content = $('<div>').append($(aboveContent), imageContainer, $(belowContent));
      
      return content.html();
    }
    
    function preloadImage(source, callback) {
      console.log('Preloading image');
      var image = new Image();
      image.src = source;
      $(image).on('load', function() {
        console.log('Image loaded');
        if (typeof callback === 'function') callback.call();
      });
    }
    
    function openHandler() {
      var rel = $(this).attr('rel');
      currentImage = $(this);
      images = $(triggerClass + (rel ? '[rel="' + rel + '"]' : ''));
      
      preloadImage(currentImage.attr('href'), function() {
        _this.modal = new Modal(null, {
          content: generateContent(currentImage, images),
          classes: 'lightbox',
          afterClose: closeHandler
        }).open();
      });
      
      return false;
    }
  };
  
  function closeHandler() {
    images = null;
    currentImage = null;
  }
  
  window.Lightbox = Lightbox;
  window.Modal = Modal;
}(jQuery));
