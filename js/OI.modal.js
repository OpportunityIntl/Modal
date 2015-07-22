(function($) {
  $.fn.modal = function(options) {
    return this.each(function() {
      new Modal($(this), options);
    });
  };
}(jQuery));

var OI = OI || {};

OI.modal = {
  init: function() {
    // If #modals div doesn't already exist, create it
    if ($('#modals').length === 0) {
      $('body').append($('<div>', {id: "modals"}));
    }
    
    // automatically set up triggers for elements with data-modal attribute
    $('[data-modal]').modal();
  },
  
  show: function(elem) {
    // add class to body to start modal overlay animation
    $('body').addClass('animate-modal');
    
    // start modal animation shortly after overlay animation
    setTimeout(function() {
      $('body').addClass('show-modal');
      elem.addClass('show');
    }, 100);
    
    // close modal when close button is clicked
    elem.find('.close').bind('click.modal', function() {
      OI.modal.hide(elem);
    });
    
    // close modal when user clicks anywhere outside of modal
    $('#modals').bind('click.modal', function() {
      OI.modal.hide(elem);
    });
    elem.bind('click.modal', function(e) {
      e.stopPropagation(); // this prevents a click on the actual modal from triggering close
    });
    
    // close modal with escape key
    $(document).bind('keyup.modal', function (e) {
      if (e.keyCode == '27') {
        OI.modal.hide(elem);
      }
    });
    
    return false;
  },
  
  hide: function(elem) {
    // unbind event handlers that close the modal
    elem.find('.close').unbind('click.modal');
    $('#modals').unbind('click.modal');
    elem.unbind('click.modal');
    $(document).unbind('keyup.modal');
    
    // start close animation on modal
    $('body').removeClass('show-modal');
    elem.removeClass('show');
    
    // start close animation on modal overlay shortly afterward
    setTimeout(function() {
      $('body').removeClass('animate-modal');
      
      // if element was created dynamically, remove it on close
      if (elem.data('destroyOnClose')) {
        elem.remove();
      }
    }, 500);
  },
  
  new: function(content, classes) {
    var modal = $('<div>', {class: 'modal'});
    modal.append($('<button>', {type: 'button', class: 'reset icon-cross close'}));
    modal.append($('<div>', {class: 'modal-content'}));
    if (classes) modal.addClass(classes);
    modal.find('.modal-content').append(content);
    $('#modals').append(modal);
    modal.data('destroyOnClose', true);
    return modal;
  }
};

var Modal = function(triggerClass, options) {
  var elem = $(triggerClass);
  var modal;

  options = $.extend({
    classes: elem.data('modal-classes') || null,
    content: null
  }, options);
  
  if (typeof options.content === 'function') {
    options.content = options.content.call(elem);
  }
  
  function isUrl(source) {
    return /^https?:\/\//.test(source);
  }
  
  function isVideo(source) {
    return /^https?:\/\/(www\.youtube|player\.vimeo)/.test(source);
  }
  
  function existsInDOM(source) {
    return ($(source).length > 0);
  }
  
  elem.click(function() {
    if (isUrl(elem.data('modal'))) {
      var iframe;
      if (isVideo(elem.data('modal'))) {
        iframe = $('<div>', {class: 'flex-video'});
        iframe.append($('<iframe>', {src: elem.data('modal'), frameborder: 0}));
      } else {
        iframe = $('<div>', {class: 'iframe'});
        iframe.append($('<iframe>', {src: elem.data('modal'), frameborder: 0}));
      }
      modal = OI.modal.new(iframe, options.classes);
    } else {
      if (existsInDOM(elem.data('modal'))) {
        modal = $(elem.data('modal'));
      } else {
        modal = OI.modal.new(options.content, options.classes);
      }
    }
    
    OI.modal.show(modal);
  });
};

OI.modal.init();
