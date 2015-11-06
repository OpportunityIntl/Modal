(function($) {
  $.fn.modal = function(options) {
    return this.each(function() {
      new Modal($(this), options);
    });
  };
  
  $.fn.modal.defaults = {
    content: null,
    zIndex: 3,
    beforeOpen: function() {},
    afterOpen: function() {},
    beforeClose: function() {},
    afterClose: function() {},
    fixedElements: []
  };
  
  $.modal = function(options) {
    new Modal(null, options).open();
  };
  
  // define Modal class
  var Modal = function(triggerClass, options) {
    // cache this
    var _this = this;
    
    // declare some variables we're going to need
    var $trigger = $(triggerClass);
    var $element;
    var modal;
    var bodyScrollTop = 0;
    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
    var dataAttributeDefaults = {
      classes: $trigger.data('modal-classes') || null,
      source: $trigger.data('modal') || null,
      type: $trigger.data('modal-type') || null,
    };
    
    // extend default options with per-instance options
    options = $.extend({}, dataAttributeDefaults, $.fn.modal.defaults, options);
    
    var fixedElements = $.merge([
      {
        element: $('.modal button.close.fixed'),
        property: 'right'
      }
    ], options.fixedElements);
    
    // if content is declared as a function, execute it to get a string
    if (typeof options.content === 'function') {
      options.content = options.content.call($trigger);
    }
    
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
    
    // determines if modal source is a url
    function isUrl() {
      return /^https?:\/\//.test(options.source);
    }
     
    // determines if modal source is a video
    function isVideo() {
      return /^https?:\/\/(www\.youtube|player\.vimeo)/.test(options.source);
    }
    
    // determines if modal source is an element and already in the DOM
    function existsInDOM() {
      return ($(options.source).length > 0) ? true : false;
    }
    
    function handleOverflow() {
      if ($element) {
        if ($element.find('.modal-container').outerHeight() >= $(window).height()) {
          $element.addClass('overflow');
        } else {
          $element.removeClass('overflow');
        }
      }
    }
    
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
      
      // add padding-right to body to account for scrollbar
      if (iOS) {
        $('#content').css('padding-right', scrollbarWidth);
      } else {
        $('body').css('padding-right', scrollbarWidth);
      }
      
      $.each(fixedElements, function(index, fixedElement) {
        fixedElement.element.css(fixedElement.property, parseInt(fixedElement.element.css(fixedElement.property)) + scrollbarWidth);
      });
    }
    
    function removeScrollbarFix() {
      // remove extra padding added to account for scrollbar
      if (iOS) {
        $('#content').css('padding-right', '');
      } else {
        $('body').css('padding-right', '');
      }
      
      $.each(fixedElements, function(index, fixedElement) {
        fixedElement.element.css(fixedElement.property, '');
      });
    }
    
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
    
    function verticalCenterAlign() {
      if ($element) {
        var $modalContainer = $element.find('.modal-container');
        if ($element.hasClass('overflow')) {
          $modalContainer.css('margin-top', '');
        } else {
          $modalContainer.css('margin-top', -$modalContainer.height() / 2);
        }
      }
    }
    
    function setZIndex() {
      $element.css('z-index', options.zIndex);
    }
    
    function setUpiOSfix() {
      if (iOS && $('#content').length === 0) {
        $('body').wrapInner('<div id="content">');
      }
    }
    
    this.type = options.type || determineType();
    
    // gets the DOM object for the modal and stores it in the $element variable
    this.setElement = function() {
      var iframe;
      
      switch(_this.type) {
        case 'video':
          // if the url is a video embed (YouTube or Vimeo), wrap the iframe in
          // Weavr's .flex-video class to make it responsive and force a 16:9 ratio
          iframe = $('<div>', {class: 'flex-video'});
          iframe.append($('<iframe>', {src: $trigger.data('modal'), frameborder: 0}));
          
          options.content = iframe;
          
          $element = _this.createElement();
          break;
        case 'url':
          // if the url is not a video, wrap the iframe in generic .iframe class
          // to make it responsive and force a 4:3 ratio
          iframe = $('<div>', {class: 'iframe'});
          iframe.append($('<iframe>', {src: $trigger.data('modal'), frameborder: 0}));
          
          options.content = iframe;
          
          $element = _this.createElement();
          break;
        case 'content':
          // if the modal source is a DOM object that already exists, use that
          $element = $(options.source);
          
          break;
        case 'dynamic':
          // otherwise, create a new element
          $element = _this.createElement();
          
          break;
      }
      
      $element.data('modal', _this);
    };
    
    // create the modal element and add it to the DOM
    this.createElement = function() {
      // create new div with .modal class
      var $modal = $('<div>', {class: 'modal'});
      
      $modal.append($('<div>', {class: 'modal-container'}));
      
      // add the close button
      $modal.find('.modal-container').append($('<button>', {type: 'button', class: 'reset icon-cross close'}));
      
      // add the .modal-content div
      $modal.find('.modal-container').append($('<div>', {class: 'modal-content'}));
      
      // add classes, if they exist, to the .modal div
      if (options.classes) $modal.find('.modal-container').addClass(options.classes);
      
      // add content inside .modal-content div
      $modal.find('.modal-content').append(options.content);
      
      // add modal element to the #modals div
      $('body').append($modal);
      
      // flag modal element to be destroyed when closed
      $modal.data('destroyOnClose', true);
      
      return $modal;
    };
    
    this.open = function() {
      _this.setElement();
      
      if (options.beforeOpen.call($element, _this) === false) {
        return false;
      }
      
      if (!Modernizr.rgba) {
        $element.prepend($('<div>', {class: 'ie8-overlay'}));
      }
      
      disableBackgroundScroll();
      
      setZIndex();
      
      // add class to body to start modal overlay animation
      $element.addClass('animate');
      
      // start modal animation shortly after overlay animation
      setTimeout(function() {
        handleOverflow();
        
        $element.addClass('show');
        
        if (!Modernizr.csstransforms) {
          verticalCenterAlign();
        }
      }, 100);
      
      // close modal when close button is clicked
      $element.find('.close').bind('click.modal', function() {
        _this.close();
      });
      
      // close modal when user clicks anywhere outside of modal
      $element.bind('click.modal', function() {
        _this.close();
      });
      $element.find('.modal-container').bind('click.modal', function(e) {
        e.stopPropagation(); // this prevents a click on the actual modal from triggering close
      });
      
      // close modal with escape key
      $(document).bind('keyup.modal', function (e) {
        if (e.keyCode == '27') {
          _this.close();
        }
      });
      
      // execute afterOpen callback after animation has finished
      setTimeout(function() {
        options.afterOpen.call($element, _this);
      }, 600);
      return false;
    };
    
    this.close = function() {
      if (options.beforeClose.call($element, _this) === false) {
        return false;
      }
      
      enableBackgroundScroll();
      
      // unbind event handlers that close the modal
      $element.find('.close').unbind('click.modal');
      $('#modals').unbind('click.modal');
      $element.unbind('click.modal');
      $(document).unbind('keyup.modal');
      
      // start close animation on modal
      $element.removeClass('show');
      
      // start close animation on modal overlay shortly afterward
      setTimeout(function() {
        $element.removeClass('animate');
        
        handleOverflow();
        
        if (!Modernizr.rgba) {
          $element.find('.ie8-overlay').remove();
        }
        
        options.afterClose.call($element, _this);
        
        // if element was created dynamically, remove it on close
        if ($element.data('destroyOnClose')) {
          $element.remove();
        }
      }, 500);
      
    };
    
    setUpiOSfix();
    
    // when trigger is clicked, set/create the modal and show it
    $trigger.click(function() {
      _this.open();
      return false;
    });
    
    $(window).resize(function() {
      handleOverflow();
      
      if (!Modernizr.csstransforms) {
        verticalCenterAlign();
      }
    });
  };
  
  window.Modal = Modal;
}(jQuery));
