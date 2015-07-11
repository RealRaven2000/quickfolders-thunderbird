"use strict";
/* BEGIN LICENSE BLOCK

QuickFolders is released under the Creative Commons (CC BY-ND 4.0)
Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0) 
For details, please refer to license.txt in the root folder of this extension

END LICENSE BLOCK */

QuickFolders.Licenser = {
  LicenseKey: '',  // store in preference when given
  RSA_encryption: "", // 
  RSA_decryption: "1a9a5c4b1cc62e975e3e10e4b5746c5de581dcfab3474d0488cb2cd10073e01b",
  RSA_modulus:    "2e1a582ecaab7ea39580890e1db6462137c20fb8abcad9b2dad70a610011e685",
  RSA_keylength: 256,
  MaxDigits: 35,
  DecryptedMail: '',
  DecryptedDate: '',
  AllowSecondaryMails: false,
  wasValidityTested: false, // save time do not validate again and again
  get isValidated() {
    return (this.ValidationStatus == this.ELicenseState.Valid);
  },
  ValidationStatus: 0,
  // enumeration for Validated state
  ELicenseState: {
    NotValidated: 0, // default status
    Valid: 1,
    Invalid: 2,
    Expired: 3,
    MailNotConfigured: 4,
    MailDifferent: 5,
    Empty: 6
  },
  
  licenseDescription: function licenseDescription(status) {
    const ELS = this.ELicenseState;
    switch(status) {
      case ELS.NotValidated: return 'Not Validated';
      case ELS.Valid: return 'Valid';
      case ELS.Invalid: return 'Invalid';
      case ELS.Expired: return 'Invalid';
      case ELS.MailNotConfigured: return 'Mail Not Configured';
      case ELS.MailDifferent: return 'Mail Different';
      case ELS.Empty: return 'Empty';
      default: return 'Unknown Status';
    }
  },
  
  showDialog: function showDialog(featureName) {
		let params = {inn:{referrer:featureName, instance: QuickFolders}, out:null};
    window.openDialog('chrome://quickfolders/content/register.xul','quickfolders-register','chrome,titlebar,centerscreen,resizable,alwaysRaised,instantApply',QuickFolders,params).focus();
  } ,
  // list of eligible accounts
  get Accounts() {
    const Ci = Components.interfaces;
    let util = QuickFolders.Util, 
        aAccounts=[],
        accounts = Components.classes["@mozilla.org/messenger/account-manager;1"].getService(Ci.nsIMsgAccountManager).accounts;
    if (util.Application == 'Postbox') 
      aAccounts = util.getAccountsPostbox();
    else {
      aAccounts = [];
      for (let ac in fixIterator(accounts, Ci.nsIMsgAccount)) {
        aAccounts.push(ac);
      };
    }
    return aAccounts;
  },
  
  accept: function accept() {
  
  } ,
  
  cancel: function cancel() {
  
  } ,
  
  load: function load() {
    function appendIdentity(dropdown, id, account) {
      if (!id) {
        util.logDebug('appendIdentity failed for account = ' + account ? account.key : 'unknown');
      }
      try {
        util.logDebugOptional('identities', 
          'Account: ' + account.key + '...\n'  
          + 'appendIdentity [' + dropdownCount + ']\n'
          + '  identityName = ' + (id ? id.identityName : 'empty') + '\n'
          + '  fullName = ' + (id ? id.fullName : 'empty') + '\n' 
          + '  email = ' + (id.email ? id.email : 'empty'));
        if (!id.email) {
          util.logToConsole('Omitting account ' + id.fullName + ' - no mail address');
          return;
        }
        let menuitem = document.createElement('menuitem');
        menuitem.setAttribute("id", "id" + dropdownCount++);
        // this.setEventAttribute(menuitem, "oncommand","QuickFolders.Interface.onGetMessages(this);");
        menuitem.setAttribute("fullName", id.fullName);
        menuitem.setAttribute("value", id.email);
        menuitem.setAttribute("accountKey", account.key);
        menuitem.setAttribute("label", id.identityName ? id.identityName : id.email);
        dropdown.appendChild(menuitem);
      }
      catch (ex) {
        util.logException('appendIdentity failed: ', ex);
      }
    }
    
    let util = QuickFolders.Util,
        dropdownCount = 0;
		if (window.arguments && window.arguments[1].inn.referrer) {
      let ref = document.getElementById('referrer');
      ref.value = window.arguments[1].inn.referrer;
    }
    
    // iterate accounts
    let idSelector = document.getElementById('mailIdentity'),
        popup = idSelector.menupopup,
        myAccounts = this.Accounts,
        acCount = myAccounts.length;
    util.logDebugOptional('identities', 'iterating accounts: (' + acCount + ')...');
    for (let a=0; a < myAccounts.length; a++) { 
      let ac = myAccounts[a];
      if (ac.defaultIdentity) {
        util.logDebugOptional('identities', ac.key + ': appending default identity...');
        appendIdentity(popup, ac.defaultIdentity, ac);
        continue;
      }
      let ids = ac.identities; // array of nsIMsgIdentity 
      if (ids) {
        let idCount = ids ? (ids.Count ? ids.Count() : ids.length) : 0;
        util.logDebugOptional('identities', ac.key + ': iterate ' + idCount + ' identities...');
        for (let i=0; i<idCount; i++) {
          // use ac.defaultIdentity ??
          // populate the dropdown with nsIMsgIdentity details
          let id = util.getIdentityByIndex(ids, i);
          if (!id) continue;
          appendIdentity(popup, id, ac);
        }
      }
      else {
        util.logDebugOptional('identities', 
          'Account: ' + account.key + ':\n - No identities.');
      }  
    }
    // select first item
    idSelector.selectedIndex = 0;
    this.selectIdentity(idSelector);
    
  } ,
  
  sanitizeName: function sanitizeName(name) {
    // remove bracketed stuff: "fred jones (freddy)" => "fred jones"
    let x = name.replace(/ *\([^)]*\) */g, "");
    if (x.trim)
      return x.trim();
    return x;
  },
  
  selectIdentity: function selectIdentity(element) {
    // get selectedItem attributes
    let it = element.selectedItem,
        fName = this.sanitizeName(it.getAttribute('fullName')),
        email = it.getAttribute('value'),
        names = fName.split(' ');
    document.getElementById('firstName').value = names[0];
    document.getElementById('lastName').value = names[names.length-1];
    document.getElementById('email').value = email;
  } ,
  
  goPro: function goPro() {
    // redirect to registration site; pass in the feature that brought user here
    let url;
    // short order process
    const shortOrder = "https://sites.fastspring.com/quickfolders/instant/quickfolders";
    // view product detail
    const productDetail = "http://sites.fastspring.com/quickfolders/product/quickfolders";
    let firstName = document.getElementById('firstName').value,
        lastName = document.getElementById('lastName').value,
        email = document.getElementById('email').value,
        util = QuickFolders.Util; 
    
    url = shortOrder 
        + "?contact_fname=" + firstName 
        + "&contact_lname=" + lastName 
        + "&contact_email=" + email;
        
    let queryString = '';  // action=adds
    let featureName = document.getElementById('referrer').value;
    if (featureName) {
      queryString = "&referrer=" + featureName;
    }
    util.openLinkInBrowser(null, url + queryString);
    window.close();
  }  ,

   /* obsolete form submission from code */
  postForm  : function postForm_obsolete(util) {
    let url ="http://sites.fastspring.com/quickfolders/product/quickfolders?action=order",
        oReq;
    
    if (util.PlatformVersion >=16.0) {
      const XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");    
      oReq = new XMLHttpRequest();
    }
    else {
      const { XMLHttpRequest_Legacy } = Components.classes["@mozilla.org/appshell/appShellService;1"]
                                       .getService(Components.interfaces.nsIAppShellService)
                                       .hiddenDOMWindow;
      oReq = new XMLHttpRequest_Legacy();
    }
    // oReq.onload = reqListener;
    let formData = new FormData();
    formData.append("submit", "purchase");
    oReq.open("POST", url, true);
    oReq.send(formData);  
  } ,
  
  premiumInfo: function premiumInfo(event) {
    QuickFolders.Util.openURL(event,'http://quickfolders.mozdev.org/premium.html');
  },
  
  // format QF-EMAIL:DATE;CRYPTO
  // example: QF-joe.bloggs@gotmail.com:2015-05-20;
  getDate: function getDate(LicenseKey) {
    // get mail+date portion
    let arr = LicenseKey.split(';');
    if (!arr.length)
      return null; 
    // get date portion
    let arr1=arr[0].split(':');
    if (arr1.length<2)
      return null;
    return arr1[1];
  },
  
  getMail: function getMail(LicenseKey) {
    let arr1 = LicenseKey.split(':');
    if (!arr1.length)
      return null;
    return arr1[0].substr(3); // split off QF-
  },
  
  getCrypto: function getCrypto(LicenseKey) {
    let arr=LicenseKey.split(';');
    if (arr.length<2)
      return null;
    return arr[1];
  },
  
  validateLicense: function validate(LicenseKey, maxDigits) {
    function logResult(parent) {
      util.logDebug ('validateLicense()\n returns ' 
                     + parent.licenseDescription(parent.ValidationStatus)
                     + '   [' + parent.ValidationStatus + ']');
    }
    // extract encrypted portion after ;
    const ELS = this.ELicenseState;
    let util = QuickFolders.Util,
        logIdentity = util.logIdentity.bind(util);
    if (!LicenseKey) {
      this.ValidationStatus = ELS.Empty;
      logResult(this);
      return [this.ValidationStatus, ''];
    }
    let encrypted = this.getCrypto(LicenseKey),
        clearTextEmail = this.getMail(LicenseKey),
        clearTextDate = this.getDate(LicenseKey),
        RealLicense = '';
    if (!encrypted) {
      this.ValidationStatus = ELS.Invalid;
      logResult(this);
      return [this.ValidationStatus, ''];
    }
    // RSAKeyPair(encryptionExponent, decryptionExponent, modulus)
    QuickFolders.RSA.initialise(maxDigits);
    util.logDebug ('Creating RSA key + decrypting');
    // we do not pass encryptionComponent as we don't need it for decryption
    let key = new QuickFolders.RSA.RSAKeyPair("", this.RSA_decryption, this.RSA_modulus, this.RSA_keylength);
    // decrypt
    // verify against remainder of string
    this.DecryptedMail = '';
    this.DecryptedDate = '';
    if (encrypted) try {
      RealLicense = QuickFolders.RSA.decryptedString(key, encrypted);
      this.wasValidityTested = true;
      util.logDebug ('Decryption Complete : decrypted string = ' + RealLicense);
    }
    catch (ex) {
      util.logException('RSA Decryption failed: ', ex);
    }
    if (!RealLicense) {
      this.ValidationStatus = ELS.Invalid;
      logResult(this);
      return [this.ValidationStatus, ''];
    }
    else {
      this.DecryptedMail = this.getMail(RealLicense + ":xxx");
      this.DecryptedDate = this.getDate(RealLicense + ":xxx");
      // check ISO format YYYY-MM-DD
      let regEx = /^\d{4}-\d{2}-\d{2}$/;
      if (!this.DecryptedDate.match(regEx)) {
        this.DecryptedDate = '';
        this.ValidationStatus = ELS.Invalid;
        logResult(this);
        return [this.ValidationStatus, RealLicense];
      }
    }
    if (clearTextEmail.toLocaleLowerCase() != this.DecryptedMail.toLocaleLowerCase()) {
      this.ValidationStatus = ELS.MailDifferent;
      logResult(this);
      return [this.ValidationStatus, RealLicense];
    }
    // ******* CHECK LICENSE EXPIRY  ********
    // get current date
    let today = new Date(),
        dateString = today.toISOString().substr(0, 10);
    if (this.DecryptedDate < dateString) {
      this.ValidationStatus = ELS.Expired;
      logResult(this);
      return [this.ValidationStatus, RealLicense];
    }
    // ******* MATCH MAIL ACCOUNT  ********
    // check mail accounts for setting
    // if not found return MailNotConfigured
    
    let isMatched = false, 
        iAccount=0,
        isDbgAccounts = QuickFolders.Preferences.isDebugOption('premium.licenser'),
        hasDefaultIdentity = false,
        myAccounts = this.Accounts;
    
    for (let a=0; a < myAccounts.length; a++) { 
      if (myAccounts[a].defaultIdentity) {
        hasDefaultIdentity = true;
        break;
      }
    }
    if (!hasDefaultIdentity) {
      this.AllowSecondaryMails = true;
      util.logDebug("Premium License Check: There is no account with default identity!\n" +
                    "You may want to check your account configuration as this might impact some functionality.\n" + 
                    "Allowing use of secondary email addresses...");
    }
    let licensedMail = this.DecryptedMail.toLowerCase();
    for (let a=0; a < myAccounts.length; a++) { 
      let ac = myAccounts[a];
      iAccount++;
      if (ac.defaultIdentity) {
        util.logDebugOptional("premium.licenser", "Iterate accounts: [" + ac.key + "] Default Identity =\n" 
          + logIdentity(ac.defaultIdentity));
        if (ac.defaultIdentity.email.toLowerCase()==licensedMail) {
          isMatched = true;
          break;
        }
      }
      else {
        util.logDebugOptional("premium.licenser", "Iterate accounts: [" + ac.key + "] has no default identity!");
        if (!this.AllowSecondaryMails) continue;
        // ... allow using non default identities 
        // we might protect this execution branch 
        // with a config preference!
        let ids = ac.identities, // array of nsIMsgIdentity 
            idCount = ids ? (ids.Count ? ids.Count() : ids.length) : 0;
        util.logDebugOptional("premium.licenser", "Iterating " + idCount + " ids...");
        if (ids) {
          for (let i=0; i<idCount; i++) {
            // use ac.defaultIdentity ??
            // populate the dropdown with nsIMsgIdentity details
            let id = util.getIdentityByIndex(ids, i);
            if (!id) {
              util.logDebugOptional("premium.licenser", "Invalid nsIMsgIdentity: " + i);
              continue;
            }
            let matchMail = id.email.toLocaleLowerCase();
            if (isDbgAccounts) {
              util.logDebugOptional("premium.licenser", 
                "Account[" + ac.key + "], Identity[" + i + "] = " + logIdentity(id) +"\n"
                + "Email: [" + matchMail + "]");
            }
            if (this.AllowSecondaryMails && matchMail==licensedMail) {
              isMatched = true;
              break;
            }
          }
          if (isMatched) break;
        }     
      }
    }
    if (!isMatched) {
      this.ValidationStatus = ELS.MailNotConfigured;
    }
    else {
      this.ValidationStatus = ELS.Valid;
    }
    logResult(this);
    return [this.ValidationStatus, RealLicense];
  },
  
  /*** for test only, will be removed **/
  encryptLicense: function encryptLicense(LicenseKey, maxDigits) {
    QuickFolders.Util.logDebug ('encryptLicense - initialising with maxDigits = ' + maxDigits);
    QuickFolders.RSA.initialise(maxDigits);
    // 64bit key pair
    QuickFolders.Util.logDebug ('encryptLicense - creating key pair object, bit length = ' + this.RSA_keylength);
    let key = new QuickFolders.RSA.RSAKeyPair(
      this.RSA_encryption,
      this.RSA_decryption,
      this.RSA_modulus,
      this.RSA_keylength
    );
    QuickFolders.Util.logDebug ('encryptLicense - starting encryption...');
    let Encrypted = QuickFolders.RSA.encryptedString(key, LicenseKey, 'OHDave');
    QuickFolders.Util.logDebug ('encryptLicense - finished encrypting registration key of length: ' + Encrypted.length + '\n'
      + Encrypted);
    return Encrypted;
    
  }

}