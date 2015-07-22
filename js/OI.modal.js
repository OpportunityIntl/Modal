var OI = OI || {};

OI.modal = {
  overlay: $('.modal-overlay'),
  init: function() {
    if ($('#modals').length === 0) {
      $('body').append($('<div>', {id: "modals"}));
    }
    $('.modal-trigger').each(function() {
      new Modal($(this));
    });
  },
  
  show: function(elem) {
    $('body').addClass('animate-modal');
    setTimeout(function() {
      $('body').addClass('show-modal');
      elem.addClass('show');
    }, 100);
    
    elem.find('.close').bind('click.modal', function() {
      OI.modal.hide(elem);
    });
    
    $('#modals').bind('click.modal', function() {
      OI.modal.hide(elem);
    });
    
    elem.bind('click.modal', function(e) {
      e.stopPropagation();
    });
    
    $(document).bind('keyup.modal', function (e) {
      if (e.keyCode == '27') {
        OI.modal.hide(elem);
      }
    });
    
    return false;
  },
  
  hide: function(elem) {
    elem.find('.close').unbind('click.modal');
    $('#modals').unbind('click.modal');
    elem.unbind('click.modal');
    $(document).unbind('keyup.modal');
    
    $('body').removeClass('show-modal');
    elem.removeClass('show');
    setTimeout(function() {
      $('body').removeClass('animate-modal');
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
  
  function isUrl() {
    return /^https?:\/\//.test(elem.data('modal'));
  }
  
  function isVideo() {
    return /^https?:\/\/(www\.youtube|player\.vimeo)/.test(elem.data('modal'));
  }
  
  function alreadyExists() {
    return ($(elem.data('modal')).length > 0);
  }
  
  elem.click(function() {
    if (isUrl()) {
      var iframe;
      if (isVideo()) {
        iframe = $('<div>', {class: 'flex-video'});
        iframe.append($('<iframe>', {src: elem.data('modal'), frameborder: 0}));
      } else {
        iframe = $('<div>', {class: 'iframe'});
        iframe.append($('<iframe>', {src: elem.data('modal'), frameborder: 0}));
      }
      modal = OI.modal.new(iframe, options.classes);
    } else {
      if (alreadyExists()) {
        modal = $(elem.data('modal'));
      } else {
        modal = OI.modal.new(options.content, options.classes);
      }
    }
    
    OI.modal.show(modal);
  });
};

OI.modal.init();
