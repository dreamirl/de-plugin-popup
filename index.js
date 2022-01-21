import DE from '@dreamirl/dreamengine';
import './index.css';

const TEMPLATE = `
  <p class="content"></p>
  <p class="content-2"></p>
  <p class="styling-utility-1"></p>
  <p class="styling-utility-2"></p>
  <div class="buttonsPrompt">
    <button class="noPrompt">No</button>
    <button class="yesPrompt">Yes</button>
  </div>
  <div class="inputTextfield">
    <input type="text" class="valueTextfield" autofocus>
  </div>
  <div class="buttonsTextfield">
    <button class="cancelTextfield">Cancel</button>
    <button class="okTextfield">Ok</button>
  </div>
  <div class="buttonsDefault">
    <button class="okBtn">Ok</button>
  </div>
  <div class="buttonsCustom">
  </div>
`;

const DEFAULT_DOM_CONTAINER_ID = 'render';

const Popup = function() {
  DE.Events.Emitter.call(this);
  this.trigger = this.emit;

  this.DEName = 'Popup';
  this.popups = {};
  this.popupsOpeningOrder = [];
  this.nPopups = 0;
  this.el = null;
  this.template = null;
  this.inited = false;
  
  this.popupBackInput = ''
  this.popupConfirmInput = ''

  this.onPopupBack = null;
  this.onPopupConfirm = null;

  var _self = this;

  this.defaultSounds = {
    yes: undefined,
    no: undefined,
    ok: undefined,
    default: undefined,
  };

  this.init = function(params) {
    if (this.inited) return;
    params = params || {};

    this.popupBackInput = params.popupBackInput ?? 'popupBack'
    this.popupConfirmInput = params.popupConfirmInput ?? 'popupConfirm'

    let domContainer = document.getElementById(
      params.containerId || DEFAULT_DOM_CONTAINER_ID,
    );
    this.template = params.template || TEMPLATE;

    if (!domContainer) {
      throw new Error(
        "FATAL ERROR: Can't init Popups without an element -- " +
        'selector:: ' +
        params.containerId,
      );
    }

    this.el = document.createElement('div');
    this.el.id = 'de-plugin-popups-container';

    domContainer.appendChild(this.el);
    this.inited = true;
    this.el.style.display = 'none';

    DE.Inputs.on('keyDown', this.popupBackInput, () => this.onPopupBack());
    DE.Inputs.on('keyDown', this.popupConfirmInput, () => this.onPopupConfirm());
  };

  this.onPopupBack = function() {
    if (this.popupsOpeningOrder.length === 0) return;

    let popupId = this.popupsOpeningOrder[this.popupsOpeningOrder.length - 1];

    if (this.popups[popupId].backCallback) {
      this.popups[popupId].backCallback();
    }
  };

  this.onPopupConfirm = function() {
    if (this.popupsOpeningOrder.length === 0) return;

    let popupId = this.popupsOpeningOrder[this.popupsOpeningOrder.length - 1];

    if (this.popups[popupId].confirmCallback) {
      this.popups[popupId].confirmCallback();
    }
  };

  /****
   * create a popup in the windw, fill to window with js detection
   text is the content, type = prompt || info
   if you use prompt type, callbacks and contexts args are objects with yes and no values
   if you use info (default), callbacks and contexts args are directly functions
   */
  this.create = function(text, type, callbacks, contexts, closes) {
    if (!this.inited) return;

    var id = Date.now() + '-' + ((Math.random() * 100) >> 0);
    var popup = document.createElement('div');
    popup.innerHTML = this.template;
    popup.getElementsByClassName('content')[0].innerHTML = text;

    popup.getElementsByClassName('buttonsPrompt')[0].style.display = 'none';
    popup.getElementsByClassName('inputTextfield')[0].style.display = 'none';
    popup.getElementsByClassName('buttonsTextfield')[0].style.display = 'none';
    popup.getElementsByClassName('buttonsCustom')[0].style.display = 'none';
    popup.id = 'popup' + id;
    popup.className = 'de-plugin-popup';

    switch (type) {
      case 'prompt':
        if (contexts && !contexts.yes)
          contexts = { yes: contexts, no: contexts };
        if (!contexts) contexts = { yes: window, no: window };
        popup.getElementsByClassName('buttonsDefault')[0].style.display =
          'none';
        popup.getElementsByClassName('buttonsPrompt')[0].style.display =
          'block';
        var yes = popup.getElementsByClassName('yesPrompt')[0];
        var dicoY = DE.Localization.get('popup.yes');
        if (dicoY == 'popup.yes') {
          dicoY = DE.Localization.get('yes');
        }
        yes.innerHTML = dicoY === 'yes' ? 'Yes' : dicoY;
        popup.confirmCallback = function(e) {
          if (e !== undefined) e.stopPropagation();
          if (e !== undefined) e.preventDefault();

          if (
            callbacks.sound_yes ||
            callbacks.sound ||
            _self.defaultSounds.yes ||
            _self.defaultSounds.default
          )
            DE.Audio.fx.play(
              callbacks.sound_yes ||
              callbacks.sound ||
              _self.defaultSounds.yes ||
              _self.defaultSounds.default,
            );
          if (callbacks.yes) {
            if (contexts.yes) {
              callbacks.yes.call(contexts.yes);
            } else {
              callbacks.yes();
            }
          }
          _self.remove(popup.id);
          return false;
        };
        yes.addEventListener('pointerup', popup.confirmCallback);
        var no = popup.getElementsByClassName('noPrompt')[0];
        var dicoN = DE.Localization.get('popup.no');
        if (dicoN == 'popup.no') {
          dicoN = DE.Localization.get('no');
        }
        no.innerHTML = dicoN === 'no' ? 'No' : dicoN;
        popup.backCallback = function(e) {
          if (e !== undefined) e.stopPropagation();
          if (e !== undefined) e.preventDefault();

          if (
            callbacks.sound_no ||
            callbacks.sound ||
            _self.defaultSounds.no ||
            _self.defaultSounds.default
          )
            DE.Audio.fx.play(
              callbacks.sound_no ||
              callbacks.sound ||
              _self.defaultSounds.no ||
              _self.defaultSounds.default,
            );
          if (callbacks.no) {
            if (contexts.no) {
              callbacks.no.call(contexts.no);
            } else {
              callbacks.no();
            }
          }
          _self.remove(popup.id);
          return false;
        };
        no.addEventListener('pointerup', popup.backCallback);
        break;

      // generate a button list
      case 'custom': // TODO: add closeCallback https://github.com/dreamirl/de-plugin-popup/pull/2/files#r788999227
        popup.getElementsByClassName('buttonsDefault')[0].style.display =
          'none';
        var buttons = popup.getElementsByClassName('buttonsCustom')[0];
        buttons.style.display = 'block';
        while (buttons.firstChild) buttons.removeChild(buttons.firstChild);
        for (var i in callbacks) {
          if (i == 'sound') continue;
          b = document.createElement('button');
          b.className = i;
          b.i = i;
          b.innerHTML = DE.Localization.get(i);
          b.addEventListener('pointerup', function(e) {
            e.stopPropagation();
            e.preventDefault();

            var target = e.target;
            while (target.tagName.toLowerCase() != 'button')
              target = target.parentElement;
            if (callbacks.sound || _self.defaultSounds.default)
              DE.Audio.fx.play(callbacks.sound || _self.defaultSounds.default);
            callbacks[target.i].call(contexts, e);
            if (closes.indexOf(target.i) != -1) _self.remove(popup.id);
            return false;
          });

          buttons.appendChild(b);
        }
        break;

      // generate a text field with cancel/ok buttons
      case 'textfield':
        if (contexts && !contexts.ok)
          contexts = { ok: contexts, cancel: contexts };
        if (!contexts) contexts = { ok: window, cancel: window };

        popup.getElementsByClassName('buttonsDefault')[0].style.display =
          'none';
        popup.getElementsByClassName('inputTextfield')[0].style.display =
          'block';
        popup.getElementsByClassName('buttonsTextfield')[0].style.display =
          'block';
        popup.getElementsByClassName('valueTextfield')[0].setAttribute('maxlength', callbacks.maxlength || 20);

        setTimeout(() => {
          popup.getElementsByClassName('valueTextfield')[0].focus();
        }, 250);

        var cancel = popup.getElementsByClassName('cancelTextfield')[0];
        cancel.innerHTML = DE.Localization.get('cancel');
        popup.backCallback = function(e) {
          if (e !== undefined) e.stopPropagation();
          if (e !== undefined) e.preventDefault();

          if (
            callbacks.sound ||
            _self.defaultSounds.no ||
            _self.defaultSounds.default
          )
            DE.Audio.fx.play(
              callbacks.sound ||
              _self.defaultSounds.no ||
              _self.defaultSounds.default,
            );
          if (callbacks.cancel) callbacks.cancel.call(contexts.cancel);
          _self.remove(popup.id);
          return false;
        };
        cancel.addEventListener('pointerup', popup.backCallback);

        var ok = popup.getElementsByClassName('okTextfield')[0];
        var dico = DE.Localization.get('popup.ok');
        if (dico == 'popup.ok') {
          dico = DE.Localization.get('ok');
        }
        ok.innerHTML = dico === 'ok' ? 'Ok' : dico;
        popup.confirmCallback = function(e) {
          if (e !== undefined) e.stopPropagation();
          if (e !== undefined) e.preventDefault();

          if (
            callbacks.sound ||
            _self.defaultSounds.ok ||
            _self.defaultSounds.default
          )
            DE.Audio.fx.play(
              callbacks.sound ||
              _self.defaultSounds.ok ||
              _self.defaultSounds.default,
            );
          if (callbacks.ok)
            callbacks.ok.call(
              contexts.ok,
              popup.getElementsByClassName('valueTextfield')[0].value,
            );
          _self.remove(popup.id);
          return false;
        };
        ok.addEventListener('pointerup', popup.confirmCallback);
        break;

      case 'textfield-password':
        if (contexts && !contexts.ok)
          contexts = { ok: contexts, cancel: contexts };
        if (!contexts) contexts = { ok: window, cancel: window };

        popup.getElementsByClassName('buttonsDefault')[0].style.display =
          'none';
        popup.getElementsByClassName('inputTextfield')[0].style.display =
          'block';
        popup.getElementsByClassName('buttonsTextfield')[0].style.display =
          'block';
        popup.getElementsByClassName('valueTextfield')[0].setAttribute('maxlength', callbacks.maxlength || 20);
        popup.getElementsByClassName('valueTextfield')[0].setAttribute('type', "password");
        popup.getElementsByClassName('inputTextfield')[0].innerHTML += `<button onclick="const password = document.querySelector('.valueTextfield');password.setAttribute('type', password.getAttribute('type') === 'password' ? 'text' : 'password');"
          id="togglePassword"  cursor: pointer;">Voir</button>`
        setTimeout(() => {
          popup.getElementsByClassName('valueTextfield')[0].focus();
        }, 250);

        var cancel = popup.getElementsByClassName('cancelTextfield')[0];
        cancel.innerHTML = DE.Localization.get('cancel');
        popup.backCallback = function(e) {
          if (e !== undefined) e.stopPropagation();
          if (e !== undefined) e.preventDefault();

          if (
            callbacks.sound ||
            _self.defaultSounds.no ||
            _self.defaultSounds.default
          )
            DE.Audio.fx.play(
              callbacks.sound ||
              _self.defaultSounds.no ||
              _self.defaultSounds.default,
            );
          if (callbacks.cancel) callbacks.cancel.call(contexts.cancel);
          _self.remove(popup.id);
          return false;
        };
        cancel.addEventListener('pointerup', popup.backCallback);

        var ok = popup.getElementsByClassName('okTextfield')[0];
        var dico = DE.Localization.get('popup.ok');
        if (dico == 'popup.ok') {
          dico = DE.Localization.get('ok');
        }
        ok.innerHTML = dico === 'ok' ? 'Ok' : dico;
        popup.confirmCallback = function(e) {
          if (e !== undefined) e.stopPropagation();
          if (e !== undefined) e.preventDefault();

          if (
            callbacks.sound ||
            _self.defaultSounds.ok ||
            _self.defaultSounds.default
          )
            DE.Audio.fx.play(
              callbacks.sound ||
              _self.defaultSounds.ok ||
              _self.defaultSounds.default,
            );
          if (callbacks.ok)
            callbacks.ok.call(
              contexts.ok,
              popup.getElementsByClassName('valueTextfield')[0].value,
            );
          _self.remove(popup.id);
          return false;
        };
        ok.addEventListener('pointerup', popup.confirmCallback);
        break;

      default:
        // default is information with button ok
        if (!contexts) contexts = window;

        var okBtn = popup.getElementsByClassName('okBtn')[0];
        okBtn.innerHTML = DE.Localization.get('ok');
        popup.confirmCallback = popup.backCallback = function(e) {
          if (e !== undefined) e.stopPropagation();
          if (e !== undefined) e.preventDefault();

          // in this case, closes is the sound
          if (closes || _self.defaultSounds.ok || _self.defaultSounds.default)
            DE.Audio.fx.play(
              closes || _self.defaultSounds.ok || _self.defaultSounds.default,
            );
          if (callbacks) callbacks.call(contexts);
          _self.remove(popup.id);
          return false;
        };
        okBtn.addEventListener('pointerup', popup.backCallback);
        break;
    }

    this.el.appendChild(popup);
    this.el.style.display = 'flex';

    this.popups[popup.id] = popup;
    this.popupsOpeningOrder.push(popup.id);
    ++this.nPopups;

    if (this.nPopups === 1) {
      DE.Inputs.lockKeys([this.popupBackInput, this.popupConfirmInput]);
    }

    this.trigger('create', popup);
    return popup;
  };

  this.remove = function(id) {
    if (!this.popups[id]) return;
    this.el.removeChild(this.popups[id]);
    this.trigger('kill');

    if (--this.nPopups == 0) {
      this.trigger('zeroPopups');
      this.el.style.display = 'none';

      DE.Inputs.unlockKeys();
    }
    delete this.popups[id];
    this.popupsOpeningOrder.splice(this.popupsOpeningOrder.indexOf(id), 1);
  };

  this.removeAll = function() {
    for (var i in this.popups) {
      this.remove(i);
    }
  };
};

Popup.prototype = Object.create(DE.Events.Emitter.prototype);
Popup.prototype.constructor = Popup;

const popup = new Popup();
export default popup;
