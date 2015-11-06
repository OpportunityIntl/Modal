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
    beforeOpen: function() {},
    afterOpen: function() {},
    beforeClose: function() {},
    afterClose: function() {},
    fixedElements: []
  };
  
  // jQuery function to intitialize and open a modal programatically
  $.modal = function(options) {
    new Modal(null, options).open();
  };
  
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
    
    /**********************
     * Private properties *
     **********************/
    
    // Current scrollTop of the body/window (used for iOS no-scroll fix)
    var bodyScrollTop = 0;
    
    // Boolean to identify iOS devices for no-scroll fix
    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
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
        if (isVideo()) {
          type = 'video';
        } else {
          type = 'url';
        }
      } else {
        if (existsInDOM()) {
          type = 'content';
        } else {
          type = 'dynamic';
        }
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
        if (_this.element.find('.modal-container').outerHeight() >= $(window).height()) {
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
        $('#content').css('padding-right', scrollbarWidth);
      } else {
        $('body').css('padding-right', scrollbarWidth);
      }
      
      // adjust offset of fixed elements defined in options
      $.each(fixedElements, function(index, fixedElement) {
        fixedElement.element.css(fixedElement.property, parseInt(fixedElement.element.css(fixedElement.property)) + scrollbarWidth);
      });
    }
    
    // Resets the scrollbar fix put in place to prevent content
    // shifts when modal is opened in browser and operating systems that
    // display scrollbars
    function removeScrollbarFix() {
      // remove extra padding added to account for scrollbar
      if (iOS) {
        $('#content').css('padding-right', '');
      } else {
        $('body').css('padding-right', '');
      }
      
      // reset offset of fixed elements defined in options
      $.each(fixedElements, function(index, fixedElement) {
        fixedElement.element.css(fixedElement.property, '');
      });
    }
    
    // Disables background scrolling. iOS Safari is a huge pain and requires
    // a messy workaround to disable background scrolling.
    function disableBackgroundScroll() {
      addScrollbarFix();
      if (iOS) {
        bodyScrollTop = $(window).scrollTop();
        $('body').addClass('ios-no-scroll');
        $('#content').css('top', -bodyScrollTop);
      } else {
        $('body').addClass('no-scroll');
      }
    }
    
    // Reenables background scrolling.
    function enableBackgroundScroll() {
      setTimeout(function() {
        removeScrollbarFix();
        if (iOS) {
          $('body').removeClass('ios-no-scroll');
          $(window).scrollTop(bodyScrollTop);
          $('#content').css('top', 0);
        } else {
          $('body').removeClass('no-scroll');
        }
      }, 500);
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
      if (iOS && $('#content').length === 0) {
        $('body').wrapInner('<div id="content">');
      }
    }
    
    // Gets the DOM object for the modal and stores it in the public element property
    function setElement() {
      var iframe;
      
      switch(_this.type) {
        case 'video':
          // if the url is a video embed (YouTube or Vimeo), wrap the iframe in
          // Weavr's .flex-video class to make it responsive and force a 16:9 ratio
          iframe = $('<div>', {class: 'flex-video'});
          iframe.append($('<iframe>', {src: _this.trigger.data('modal'), frameborder: 0}));
          
          _this.options.content = iframe;
          
          _this.element = createElement();
          break;
        case 'url':
          // if the url is not a video, wrap the iframe in generic .iframe class
          // to make it responsive and force a 4:3 ratio
          iframe = $('<div>', {class: 'iframe'});
          iframe.append($('<iframe>', {src: _this.trigger.data('modal'), frameborder: 0}));
          
          _this.options.content = iframe;
          
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
      // create new div with .modal class
      var $modal = $('<div>', {class: 'modal'});
      
      $modal.append($('<div>', {class: 'modal-container'}));
      
      // add the close button
      $modal.find('.modal-container').append($('<button>', {type: 'button', class: 'reset icon-cross close'}));
      
      // add the .modal-content div
      $modal.find('.modal-container').append($('<div>', {class: 'modal-content'}));
      
      // add classes, if they exist, to the .modal div
      if (_this.options.classes) $modal.find('.modal-container').addClass(_this.options.classes);
      
      // add content inside .modal-content div
      $modal.find('.modal-content').append(_this.options.content);
      
      // add modal element to the #modals div
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
        // check if modal is taller than window handle it if it is
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
      
      if (_this.options.beforeOpen.call(_this.element, _this) === false) {
        return false;
      }
      
      if (!Modernizr.rgba) {
        _this.element.prepend($('<div>', {class: 'ie8-overlay'}));
      }
      
      disableBackgroundScroll();
      
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
      
      // close modal when any element inside the modal with a class
      // of 'close' is clicked
      _this.element.find('.close').bind('click.modal', function() {
        _this.close();
      });
      
      // If the modal is configured to be closable, attach event handlers so
      // that modal can be closed by clicking outside of the modal or by
      // pressing the escape key. If it's not closeable, hide the close button
      // in the top righthand corner of the modal (if it already exists). Note
      // that any other element with a class of 'close' in the modal content
      // will still trigger the modal to close.
      console.log(_this.options.closeable);
      if (_this.options.closeable) {
        // close modal when user clicks anywhere outside of modal
        _this.element.bind('click.modal', function() {
          _this.close();
        });
        _this.element.find('.modal-container').bind('click.modal', function(e) {
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
      
      return false;
    };
    
    // Closes the modal
    this.close = function() {
      if (_this.options.beforeClose.call(_this.element, _this) === false) {
        return false;
      }
      
      enableBackgroundScroll();
      
      // unbind event handlers that close the modal
      _this.element.find('.close').unbind('click.modal');
      $('#modals').unbind('click.modal');
      _this.element.unbind('click.modal');
      $(document).unbind('keyup.modal');
      
      // start close animation on modal
      _this.element.removeClass('show');
      
      // start close animation on modal overlay shortly afterward
      setTimeout(function() {
        _this.element.removeClass('animate');
        
        handleOverflow();
        
        if (!Modernizr.rgba) {
          _this.element.find('.ie8-overlay').remove();
        }
        
        _this.options.afterClose.call(_this.element, _this);
        
        // if element was created dynamically, remove it on close
        if (_this.element.data('destroyOnClose')) {
          _this.element.remove();
        }
      }, 500);
    };
    
    /*********************************
     * Let's get this party started! *
     *********************************/
    initialize();
  };
  
  window.Modal = Modal;
}(jQuery));
