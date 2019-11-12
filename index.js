import DE from '@dreamirl/dreamengine';
import './index.css';

const TEMPLATE = `
<div>
  <p class="content"></p>
  <div class="buttonsPrompt">
    <button class="noPrompt">No</button>
    <button class="yesPrompt">Yes</button>
  </div>
  <div class="inputTextfield">
    <input type="text" class="valueTextfield" maxLength="4" autofocus>
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
</div>`;

const DEFAULT_DOM_CONTAINER_ID = 'render';

const Popup = function()
{
  DE.Events.Emitter.call( this );
  this.trigger = this.emit;

  this.DEName   = "Popup";
  this.popups   = {};
  this.nPopups  = 0;
  this.el       = null;
  this.template = null;
  this.inited   = false;
  var _self = this;
  
  this.init = function( params )
  {
    if ( this.inited )
      return;
    params = params || {};
    
    let domContainer = document.getElementById( params.containerId || DEFAULT_DOM_CONTAINER_ID );
    this.template = params.template || TEMPLATE;
    
    if (!domContainer) {
      throw new Error( "FATAL ERROR: Can't init Popups without an element -- "
        + "selector:: " + params.containerId );
    }

    this.el = document.createElement( 'div' );
    this.el.id = 'de-plugin-popups-container';

    domContainer.appendChild( this.el );
    this.inited = true;
    this.el.style.display = 'none';
  }
  
  /****
   * create a popup in the windw, fill to window with js detection
   text is the content, type = prompt || info
    if you use prompt type, callbacks and contexts args are objects with yes and no values
    if you use info (default), callbacks and contexts args are directly functions
    */
  this.create = function( text, type, callbacks, contexts, closes )
  {
    if ( !this.inited )
      return;
    
    var id = Date.now() + "-" + ( Math.random() * 100 >> 0 );
    var popup = document.createElement( 'div' );
      popup.innerHTML = this.template;
      popup.getElementsByClassName( 'content' )[ 0 ].innerHTML = text;
      
      popup.getElementsByClassName( 'buttonsPrompt' )[ 0 ].style.display = "none";
      popup.getElementsByClassName( 'inputTextfield' )[ 0 ].style.display = "none";
      popup.getElementsByClassName( 'buttonsTextfield' )[ 0 ].style.display = "none";
      popup.getElementsByClassName( 'buttonsCustom' )[ 0 ].style.display = "none";
      popup.id = 'popup' + id;
      popup.className = 'de-plugin-popup';
      switch( type )
      {
        case "prompt":
          if ( contexts && !contexts.yes )
            contexts = { yes: contexts, no: contexts };
          if ( !contexts )
            contexts = { yes: window, no: window };
          popup.getElementsByClassName( 'buttonsDefault' )[ 0 ].style.display = "none";
          popup.getElementsByClassName( 'buttonsPrompt' )[ 0 ].style.display = "block";
          var yes = popup.getElementsByClassName( 'yesPrompt' )[ 0 ];
          yes.innerHTML = DE.Localization.get( "yes" ) || "Yes";
          yes.addEventListener( 'pointerup'
          , function( e )
          {
            e.stopPropagation();
            e.preventDefault();
            if ( callbacks.sound )
              DE.Audio.fx.play( callbacks.sound );
            if ( callbacks.yes )
              callbacks.yes.call( contexts.yes );
            _self.remove( popup.id );
            return false;
          } );
          var no = popup.getElementsByClassName( 'noPrompt' )[ 0 ];
          no.innerHTML = DE.Localization.get( "no" ) || "No";
          no.addEventListener( 'pointerup'
          , function( e )
          {
            e.stopPropagation();
            e.preventDefault();
            if ( callbacks.sound )
              DE.Audio.fx.play( callbacks.sound );
            if ( callbacks.no )
              callbacks.no.call( contexts.no );
            _self.remove( popup.id );
            return false;
          } );
          break;
        
        // generate a button list
        case "custom":
          popup.getElementsByClassName( 'buttonsDefault' )[ 0 ].style.display = "none";
          var buttons = popup.getElementsByClassName( 'buttonsCustom' )[ 0 ];
          buttons.style.display = "block";
          while( buttons.firstChild )
            buttons.removeChild( buttons.firstChild );
          for ( var i in callbacks )
          {
            if ( i == "sound" )
              continue;
            b = document.createElement( "button" );
            b.className = i;
            b.i = i;
            b.innerHTML = DE.Localization.get( i ) || i;
            b.addEventListener( 'pointerup'
            , function( e )
            {
              e.stopPropagation();
              e.preventDefault();
              var target = e.target;
              while( target.tagName.toLowerCase() != "button" )
                target = target.parentElement;
              if ( callbacks.sound )
                DE.Audio.fx.play( callbacks.sound );
              callbacks[ target.i ].call( contexts, e );
              if ( closes.indexOf( target.i ) != -1 )
                _self.remove( popup.id );
              return false;
            } );
            buttons.appendChild( b );
          }
          break;

        // generate a text field with cancel/ok buttons
        case "textfield":
            if ( contexts && !contexts.ok )
              contexts = { ok: contexts, cancel: contexts };
            if ( !contexts )
              contexts = { ok: window, cancel: window };
              
            popup.getElementsByClassName( 'buttonsDefault' )[ 0 ].style.display = "none";
            popup.getElementsByClassName( 'inputTextfield' )[ 0 ].style.display = "block";
            popup.getElementsByClassName( 'buttonsTextfield' )[ 0 ].style.display = "block";

            setTimeout( () => {
              popup.getElementsByClassName( 'valueTextfield' )[ 0 ].focus();
            }, 250);

            var cancel = popup.getElementsByClassName( 'cancelTextfield' )[ 0 ];
            cancel.innerHTML = DE.Localization.get( "cancel" ) || "cancel";
            cancel.addEventListener( 'pointerup'
            , function( e )
            {
              e.stopPropagation();
              e.preventDefault();
              if ( callbacks.sound )
                DE.Audio.fx.play( callbacks.sound );
              if ( callbacks.cancel )
                callbacks.cancel.call( contexts.cancel );
              _self.remove( popup.id );
              return false;
            } );
            var ok = popup.getElementsByClassName( 'okTextfield' )[ 0 ];
            ok.innerHTML = DE.Localization.get( "ok" ) || "ok";
            ok.addEventListener( 'pointerup'
            , function( e )
            {
              e.stopPropagation();
              e.preventDefault();
              if ( callbacks.sound )
                DE.Audio.fx.play( callbacks.sound );
              if ( callbacks.ok )
                callbacks.ok.call( contexts.ok, popup.getElementsByClassName( 'valueTextfield' )[ 0 ].value );
              _self.remove( popup.id );
              return false;
            } );
          break;
        
        default: // default is information with button ok
          if ( !contexts )
            contexts = window;
          popup.getElementsByClassName( 'okBtn' )[ 0 ].addEventListener( 'pointerup'
          , function( e )
          {
            e.stopPropagation();
            e.preventDefault();
            // in this case, closes is the sound
            if ( closes )
              DE.Audio.fx.play( closes );
            if ( callbacks )
              callbacks.call( contexts );
            _self.remove( popup.id );
            return false;
          } );
          break;
      }
      
    this.el.appendChild( popup );
    this.el.style.display = 'block';

    this.popups[ popup.id ] = popup;
    ++this.nPopups;
    
    this.trigger( "create", popup );
    return popup;
  }
  
  this.remove = function( id )
  {
    if ( !this.popups[ id ] )
      return;
    this.el.removeChild( this.popups[ id ] );
    this.trigger( "kill" );

    if ( --this.nPopups == 0 ) {
      this.trigger( "zeroPopups" );
      this.el.style.display = 'none';
    }
    delete this.popups[id];
  }
};

Popup.prototype = Object.create( DE.Events.Emitter.prototype );
Popup.prototype.constructor = Popup;

const popup = new Popup();
export default popup;
