const KeyCode = {
  BACKSPACE: 8,
  TAB: 9,
  RETURN: 13,
  ESC: 27,
  SPACE: 32,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  END: 35,
  HOME: 36,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  DELETE: 46,
};

class Listbox {
  constructor(listboxNode) {
    this.listboxNode = listboxNode;

    this.activeDescendant = this.listboxNode.getAttribute('aria-activedescendant');
    this.keysSoFar = '';
    this.handleFocusChange = function () {};
    this.handleItemChange = function (event, items) {};
    this.registerEvents();
  }

  registerEvents() {
    this.listboxNode.addEventListener('focus', this.setupFocus.bind(this));
    this.listboxNode.addEventListener('keydown', this.checkKeyPress.bind(this));
    this.listboxNode.addEventListener('click', this.checkClickItem.bind(this));
  }

  setupFocus() {
    if (this.activeDescendant) {
      return;
    }

    this.focusFirstItem();
  };

  focusFirstItem() {
    var firstItem;

    firstItem = this.listboxNode.querySelector('[role="option"]');

    if (firstItem) {
      this.focusItem(firstItem);
    }
  };

  focusLastItem() {
    var itemList = this.listboxNode.querySelectorAll('[role="option"]');

    if (itemList.length) {
      this.focusItem(itemList[itemList.length - 1]);
    }
  };

  checkKeyPress(evt) {
    var key = evt.which || evt.keyCode;
    var nextItem = document.getElementById(this.activeDescendant);

    if (!nextItem) {
      return;
    }

    switch (key) {
      case KeyCode.PAGE_UP:
      case KeyCode.PAGE_DOWN:
        if (this.moveUpDownEnabled) {
          evt.preventDefault();

          if (key === KeyCode.PAGE_UP) {
            this.moveUpItems();
          }
          else {
            this.moveDownItems();
          }
        }

        break;
      case KeyCode.UP:
      case KeyCode.DOWN:
        evt.preventDefault();

        if (this.moveUpDownEnabled && evt.altKey) {
          if (key === KeyCode.UP) {
            this.moveUpItems();
          }
          else {
            this.moveDownItems();
          }
          return;
        }

        if (key === KeyCode.UP) {
          nextItem = nextItem.previousElementSibling;
        }
        else {
          nextItem = nextItem.nextElementSibling;
        }

        if (nextItem) {
          this.focusItem(nextItem);
        }

        break;
      case KeyCode.HOME:
        evt.preventDefault();
        this.focusFirstItem();
        break;
      case KeyCode.END:
        evt.preventDefault();
        this.focusLastItem();
        break;
      case KeyCode.SPACE:
        evt.preventDefault();
        break;
      case KeyCode.BACKSPACE:
      case KeyCode.DELETE:
      case KeyCode.RETURN:
        if (!this.moveButton) {
          return;
        }

        var keyshortcuts = this.moveButton.getAttribute('aria-keyshortcuts');
        if (key === KeyCode.RETURN && keyshortcuts.indexOf('Enter') === -1) {
          return;
        }
        if (
          (key === KeyCode.BACKSPACE || key === KeyCode.DELETE) &&
          keyshortcuts.indexOf('Delete') === -1
        ) {
          return;
        }

        evt.preventDefault();

        var nextUnselected = nextItem.nextElementSibling;
        while (nextUnselected) {
          if (nextUnselected.getAttribute('aria-selected') != 'true') {
            break;
          }
          nextUnselected = nextUnselected.nextElementSibling;
        }
        if (!nextUnselected) {
          nextUnselected = nextItem.previousElementSibling;
          while (nextUnselected) {
            if (nextUnselected.getAttribute('aria-selected') != 'true') {
              break;
            }
            nextUnselected = nextUnselected.previousElementSibling;
          }
        }

        this.moveItems();

        if (!this.activeDescendant && nextUnselected) {
          this.focusItem(nextUnselected);
        }
        break;
      default:
        var itemToFocus = this.findItemToFocus(key);
        if (itemToFocus) {
          this.focusItem(itemToFocus);
        }
        break;
    }
  };

  findItemToFocus(key) {
    var itemList = this.listboxNode.querySelectorAll('[role="option"]');
    var character = String.fromCharCode(key);

    if (!this.keysSoFar) {
      for (var i = 0; i < itemList.length; i++) {
        if (itemList[i].getAttribute('id') == this.activeDescendant) {
          this.searchIndex = i;
        }
      }
    }
    this.keysSoFar += character;
    this.clearKeysSoFarAfterDelay();

    var nextMatch = this.findMatchInRange(
      itemList,
      this.searchIndex + 1,
      itemList.length
    );
    if (!nextMatch) {
      nextMatch = this.findMatchInRange(
        itemList,
        0,
        this.searchIndex
      );
    }
    return nextMatch;
  };

  clearKeysSoFarAfterDelay() {
    if (this.keyClear) {
      clearTimeout(this.keyClear);
      this.keyClear = null;
    }
    this.keyClear = setTimeout((function () {
      this.keysSoFar = '';
      this.keyClear = null;
    }).bind(this), 500);
  };

  findMatchInRange(list, startIndex, endIndex) {
    // Find the first item starting with the keysSoFar substring, searching in
    // the specified range of items
    for (var n = startIndex; n < endIndex; n++) {
      var label = list[n].innerText;
      if (label && label.toUpperCase().indexOf(this.keysSoFar) === 0) {
        return list[n];
      }
    }
    return null;
  };

  checkClickItem(evt) {
    if (evt.target.getAttribute('role') === 'option') {
      this.focusItem(evt.target);
    }
  }

  defocusItem(element) {
    if (!element) {
      return;
    }
    element.removeAttribute('aria-selected');
    element.classList.remove('focused');
  }

  focusItem(element) {
    this.defocusItem(document.getElementById(this.activeDescendant));
    element.setAttribute('aria-selected', 'true');
    element.classList.add('focused');
    this.listboxNode.setAttribute('aria-activedescendant', element.id);
    this.activeDescendant = element.id;

    if (this.listboxNode.scrollHeight > this.listboxNode.clientHeight) {
      var scrollBottom = this.listboxNode.clientHeight + this.listboxNode.scrollTop;
      var elementBottom = element.offsetTop + element.offsetHeight;
      if (elementBottom > scrollBottom) {
        this.listboxNode.scrollTop = elementBottom - this.listboxNode.clientHeight;
      }
      else if (element.offsetTop < this.listboxNode.scrollTop) {
        this.listboxNode.scrollTop = element.offsetTop;
      }
    }

    this.handleFocusChange(element);
  };

  clearActiveDescendant() {
    this.activeDescendant = null;
    this.listboxNode.setAttribute('aria-activedescendant', null);

    if (this.moveButton) {
      this.moveButton.setAttribute('aria-disabled', 'true');
    }

    this.checkUpDownButtons();
  };

  setHandleItemChange(handlerFn) {
    this.handleItemChange = handlerFn;
  };

  setHandleFocusChange(focusChangeHandler) {
    this.handleFocusChange = focusChangeHandler;
  };
}

class ListboxButton {
  constructor(button, listbox) {
    this.button = button;
    this.buttonText = button.querySelector(".js-listbox-value");
    this.listbox = listbox;
    this.registerEvents();
  }

  registerEvents() {
    this.button.addEventListener("click", this.showListbox.bind(this));
    this.button.addEventListener("keyup", this.checkShow.bind(this));
    this.listbox.listboxNode.addEventListener(
      "blur",
      this.hideListbox.bind(this)
    );
    this.listbox.listboxNode.addEventListener(
      "keydown",
      this.checkHide.bind(this)
    );
    this.listbox.setHandleFocusChange(this.onFocusChange.bind(this));
  }

  checkShow(evt) {
    var key = evt.which || evt.keyCode;

    switch (key) {
      case KeyCode.UP:
      case KeyCode.DOWN:
        evt.preventDefault();
        this.showListbox();
        this.listbox.checkKeyPress(evt);
        break;
    }
  }

  checkHide(evt) {
    var key = evt.which || evt.keyCode;

    switch (key) {
      case KeyCode.RETURN:
      case KeyCode.ESC:
        evt.preventDefault();
        this.hideListbox();
        this.button.focus();
        break;
    }
  }

  showListbox() {
    this.listbox.listboxNode.classList.remove("hidden");
    this.button.setAttribute("aria-expanded", "true");
    this.listbox.listboxNode.focus();
  }

  hideListbox() {
    this.listbox.listboxNode.classList.add("hidden");
    this.button.removeAttribute("aria-expanded");
  }

  onFocusChange(focusedItem) {
    this.buttonText.innerHTML = focusedItem.innerHTML;
  }
}
