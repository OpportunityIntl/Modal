(function($) {
  $.fn.modal = function(options) {
    return this.each(function() {
      new Modal($(this), options);
    });
  };
  
  var Modal = function(triggerClass, options) {
    // cache this
    var _this = this;
    
    var $trigger = $(triggerClass);
    var $element;
    var modal;

    options = $.extend({
      classes: $trigger.data('modal-classes') || null,
      source: $trigger.data('modal') || null,
      content: null
    }, options);
    
    if (typeof options.content === 'function') {
      options.content = options.content.call($trigger);
    }
    
    this.isUrl = function() {
      return /^https?:\/\//.test(options.source);
    };
     
    this.isVideo = function() {
      return /^https?:\/\/(www\.youtube|player\.vimeo)/.test(options.source);
    };
    
    this.existsInDOM = function() {
      return ($(options.source).length > 0) ? true : false;
    };
    
    this.setElement = function() {
      if (_this.isUrl()) {
        var iframe;
        if (_this.isVideo()) {
          iframe = $('<div>', {class: 'flex-video'});
          iframe.append($('<iframe>', {src: $trigger.data('modal'), frameborder: 0}));
          options.content = iframe;
        } else {
          iframe = $('<div>', {class: 'iframe'});
          iframe.append($('<iframe>', {src: $trigger.data('modal'), frameborder: 0}));
          options.content = iframe;
        }
        $element = _this.createElement();
      } else {
        if (_this.existsInDOM()) {
          $element = $($trigger.data('modal'));
        } else {
          $element = _this.createElement();
        }
      }
    };
    
    this.createElement = function() {
      var modal = $('<div>', {class: 'modal'});
      modal.append($('<button>', {type: 'button', class: 'reset icon-cross close'}));
      modal.append($('<div>', {class: 'modal-content'}));
      if (options.classes) modal.addClass(options.classes);
      modal.find('.modal-content').append(options.content);
      $('#modals').append(modal);
      modal.data('destroyOnClose', true);
      return modal;
    };
    
    this.show = function() {
      // add class to body to start modal overlay animation
      $('body').addClass('animate-modal');
      
      // start modal animation shortly after overlay animation
      setTimeout(function() {
        $('body').addClass('show-modal');
        $element.addClass('show');
      }, 100);
      
      // close modal when close button is clicked
      $element.find('.close').bind('click.modal', function() {
        _this.hide();
      });
      
      // close modal when user clicks anywhere outside of modal
      $('#modals').bind('click.modal', function() {
        _this.hide();
      });
      $element.bind('click.modal', function(e) {
        e.stopPropagation(); // this prevents a click on the actual modal from triggering close
      });
      
      // close modal with escape key
      $(document).bind('keyup.modal', function (e) {
        if (e.keyCode == '27') {
          _this.hide();
        }
      });
      
      return false;
    };
    
    this.hide = function() {
      // unbind event handlers that close the modal
      $element.find('.close').unbind('click.modal');
      $('#modals').unbind('click.modal');
      $element.unbind('click.modal');
      $(document).unbind('keyup.modal');
      
      // start close animation on modal
      $('body').removeClass('show-modal');
      $element.removeClass('show');
      
      // start close animation on modal overlay shortly afterward
      setTimeout(function() {
        $('body').removeClass('animate-modal');
        
        // if element was created dynamically, remove it on close
        if ($element.data('destroyOnClose')) {
          $element.remove();
        }
      }, 500);
    };
    
    $trigger.click(function() {
      _this.setElement();
      _this.show();
    });
  };
  
  // If #modals div doesn't already exist, create it
  if ($('#modals').length === 0) {
    $('body').append($('<div>', {id: "modals"}));
  }
  
  // automatically set up triggers for elements with data-modal attribute
  $('[data-modal]').modal();
  
}(jQuery));
