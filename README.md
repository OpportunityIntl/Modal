# OI-Modals
Lightweight modal library for Opportunity International. Built on top of jQuery and Weavr. [View the demo here](http://opportunityintl.github.io/OI-Modals/). Still in progress. 

## Usage
Load `OI.modal.min.js` and `OI.modal.min.css`.

Initialize modals with Javascript:
```javascript
// attach modal to click event on a trigger element (typically a link or button)
$(selector).modal({options});

// open a modal via Javascript
$.modal({options});
```

## Modal markup structure
Modals should follow this basic structure:
```html
<div class="modal">
  <div class="modal-container">
    <button type="button" class="close icon-cross reset"></button>
    <div class="modal-content">
      <!-- Modal content goes here -->
    </div>
  </div>
</div>
```

## Options
Option | Type | Description | Default
----|----|----|----
**source** | string | Optional. CSS (or jQuery) selector of the modal. Use if markup for modal already exists in the document. | Value of trigger's `data-modal` attribute or `NULL`
**content** | string | Optional. HTML to be inserted into the `.modal-content` div. Use if markup for modal does not exist in the document or needs to be generated dynamically. | `NULL`
**classes** | string | Optional. Classes to be added to the `.modal-container` div. | Value of trigger's `data-modal-classes` or `NULL`
**beforeOpen()** | function | Optional. Callback function to be executed before modal opens. Return `false` to prevent modal from opening. | Empty function
**afterOpen()** | function| Optional. Callback function to be executed after modal opens (after animation completes). | Empty function
**beforeClose()** | function | Optional. Callback function to be executed before modal closes. Return `false` to prevent modal from closing. | Empty function
**afterClose()** | function| Optional. Callback function to be executed after modal closes (after animation completes). | Empty function
