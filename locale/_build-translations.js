#!/usr/bin/env node
/* eslint-disable no-console */
// One-shot helper used during Workstream T to seed <target> elements into the
// hi/gu/mr XLIFFs. Not part of the production build. Delete or ignore in v1.
//
// Usage: node client/locale/_build-translations.js

const fs = require('fs');
const path = require('path');

const localeDir = __dirname;
const source = fs.readFileSync(path.join(localeDir, 'messages.xlf'), 'utf8');

// Translation dictionary keyed by trans-unit id. Values are per-locale.
// Where left blank the target is emitted with state="needs-translation" +
// English source so the runtime still shows something.
const T = {
  // Rail
  'rail.today':    { hi: 'आज',     gu: 'આજે',       mr: 'आज' },
  'rail.sell':     { hi: 'बिक्री',   gu: 'વેચાણ',      mr: 'विक्री' },
  'rail.stock':    { hi: 'स्टॉक',   gu: 'સ્ટોક',      mr: 'स्टॉक' },
  'rail.people':   { hi: 'ग्राहक',   gu: 'ગ્રાહકો',     mr: 'ग्राहक' },
  'rail.schemes':  { hi: 'योजनाएं', gu: 'યોજનાઓ',    mr: 'योजना' },
  'rail.karigar':  { hi: 'कारीगर',  gu: 'કારીગર',    mr: 'कारागीर' },
  'rail.catalog':  { hi: 'कैटलॉग', gu: 'કૅટૅલોગ',   mr: 'कॅटलॉग' },
  'rail.reports':  { hi: 'रिपोर्ट',  gu: 'અહેવાલો',   mr: 'अहवाल' },
  'rail.repair':   { hi: 'मरम्मत',  gu: 'સમારકામ',  mr: 'दुरुस्ती' },
  'rail.settings': { hi: 'सेटिंग्स', gu: 'સેટિંગ્સ',    mr: 'सेटिंग्ज' },
  'rail.sign-out': { hi: 'साइन आउट', gu: 'સાઇન આઉટ', mr: 'साइन आउट' },

  // Top bar / palette
  'topbar.palette.aria':      { hi: 'कमांड पैलेट खोलें', gu: 'કમાન્ડ પૅલેટ ખોલો', mr: 'कमांड पॅलेट उघडा' },
  'topbar.search.placeholder': { hi: 'खोजें या कमांड चलाएँ', gu: 'શોધો અથવા આદેશ ચલાવો', mr: 'शोधा किंवा कमांड चालवा' },
  'palette.input.aria':        { hi: 'कमांड पैलेट इनपुट', gu: 'કમાન્ડ પૅલેટ ઇનપુટ', mr: 'कमांड पॅलेट इनपुट' },
  'palette.placeholder.root':  { hi: 'खोजें या कमांड चलाएँ...', gu: 'શોધો અથવા આદેશ ચલાવો...', mr: 'शोधा किंवा कमांड चालवा...' },
  'palette.placeholder.sub':   { hi: 'विवरण भरें...', gu: 'વિગતો ભરો...', mr: 'तपशील भरा...' },
  'palette.customer-picker.placeholder': { hi: 'नाम या फ़ोन टाइप करें...', gu: 'નામ અથવા ફોન ટાઇપ કરો...', mr: 'नाव किंवा फोन टाइप करा...' },
  'palette.footer.root': {
    hi: '<x id="START_TAG_NG_ICON" ctype="x-ng_icon" equiv-text="&lt;ng-icon name=&quot;lucideCornerDownLeft&quot; size=&quot;12&quot; aria-hidden=&quot;true&quot;&gt;"/><x id="CLOSE_TAG_NG_ICON" ctype="x-ng_icon" equiv-text="&lt;/ng-icon&gt;"/>  चुनने के लिए · नेविगेट के लिए ↑↓ · बंद करने के लिए Esc ',
    gu: '<x id="START_TAG_NG_ICON" ctype="x-ng_icon" equiv-text="&lt;ng-icon name=&quot;lucideCornerDownLeft&quot; size=&quot;12&quot; aria-hidden=&quot;true&quot;&gt;"/><x id="CLOSE_TAG_NG_ICON" ctype="x-ng_icon" equiv-text="&lt;/ng-icon&gt;"/>  પસંદ કરવા · નેવિગેટ કરવા ↑↓ · બંધ કરવા Esc ',
    mr: '<x id="START_TAG_NG_ICON" ctype="x-ng_icon" equiv-text="&lt;ng-icon name=&quot;lucideCornerDownLeft&quot; size=&quot;12&quot; aria-hidden=&quot;true&quot;&gt;"/><x id="CLOSE_TAG_NG_ICON" ctype="x-ng_icon" equiv-text="&lt;/ng-icon&gt;"/>  निवडण्यासाठी · नेव्हिगेट करण्यासाठी ↑↓ · बंद करण्यासाठी Esc ',
  },
  'palette.footer.sub':  { hi: 'वापस जाने के लिए Esc · सबमिट करने के लिए Enter', gu: 'પાછળ જવા Esc · સબમિટ કરવા Enter', mr: 'मागे जाण्यासाठी Esc · सबमिट करण्यासाठी Enter' },

  // Dashboard
  'dashboard.title':            { hi: 'आज', gu: 'આજે', mr: 'आज' },
  'dashboard.revenue':          { hi: 'राजस्व', gu: 'આવક', mr: 'महसूल' },
  'dashboard.vs-prev':          { hi: 'पिछली अवधि की तुलना में', gu: 'પાછલા સમયગાળા સામે', mr: 'मागील कालावधीच्या तुलनेत' },
  'dashboard.no-revenue':       { hi: 'अभी तक कोई राजस्व नहीं', gu: 'હજી સુધી કોઈ આવક નથી', mr: 'अद्याप महसूल नाही' },
  'dashboard.recent-invoices':  { hi: 'हाल के बिल', gu: 'તાજેતરના બિલો', mr: 'अलीकडील बिले' },
  'dashboard.fast-movers':      { hi: 'तेज़ बिकने वाले', gu: 'ઝડપી વેચાણ', mr: 'जलद विक्री' },
  'dashboard.fast-movers.sub':  { hi: 'शीर्ष उत्पाद श्रेणियां', gu: 'ટોચની ઉત્પાદન શ્રેણીઓ', mr: 'शीर्ष उत्पादन श्रेणी' },
  'dashboard.analytics-soon':   { hi: 'एनालिटिक्स जल्द आ रहा है', gu: 'એનાલિટિક્સ ટૂંક સમયમાં', mr: 'विश्लेषण लवकरच' },
  'dashboard.total-customers':  { hi: 'कुल ग्राहक', gu: 'કુલ ગ્રાહકો', mr: 'एकूण ग्राहक' },
  'dashboard.stock-grams':      { hi: 'स्टॉक (ग्राम)', gu: 'સ્ટોક (ગ્રામ)', mr: 'स्टॉक (ग्रॅम)' },
  'dashboard.pending-payments': { hi: 'बकाया भुगतान', gu: 'બાકી ચૂકવણી', mr: 'प्रलंबित पेमेंट' },
  'units.grams-moved':          { hi: 'ग्राम बिका', gu: 'ગ્રામ વેચાયું', mr: 'ग्रॅम विकले' },

  // Rate
  'rate.lock-today':      { hi: "आज का भाव लॉक करें", gu: 'આજનો ભાવ લોક કરો', mr: 'आजचा दर लॉक करा' },
  'rate.lock':            { hi: 'भाव लॉक करें', gu: 'ભાવ લોક કરો', mr: 'दर लॉक करा' },
  'rate.no-rate-today':   { hi: 'आज के लिए कोई भाव नहीं', gu: 'આજ માટે કોઈ ભાવ નથી', mr: 'आजसाठी दर नाही' },
  'rate.per-gram':        { hi: 'प्रति ग्राम भाव', gu: 'પ્રતિ ગ્રામ ભાવ', mr: 'प्रति ग्रॅम दर' },

  // Common buttons
  'buttons.add':          { hi: 'जोड़ें', gu: 'ઉમેરો', mr: 'जोडा' },
  'buttons.save':         { hi: 'सहेजें', gu: 'સાચવો', mr: 'जतन करा' },
  'buttons.save-changes': { hi: 'बदलाव सहेजें', gu: 'ફેરફારો સાચવો', mr: 'बदल जतन करा' },
  'buttons.saving':       { hi: 'सहेज रहा है...', gu: 'સાચવી રહ્યાં છે...', mr: 'जतन करत आहे...' },
  'buttons.cancel':       { hi: 'रद्द करें', gu: 'રદ કરો', mr: 'रद्द करा' },
  'buttons.clear':        { hi: 'साफ़ करें', gu: 'સાફ કરો', mr: 'साफ करा' },
  'buttons.close':        { hi: 'बंद करें', gu: 'બંધ કરો', mr: 'बंद करा' },
  'buttons.back':         { hi: 'वापस', gu: 'પાછળ', mr: 'मागे' },
  'buttons.reset':        { hi: 'रीसेट', gu: 'રીસેટ', mr: 'रीसेट' },
  'buttons.open':         { hi: 'खोलें', gu: 'ખોલો', mr: 'उघडा' },
  'buttons.import-csv':   { hi: 'CSV आयात करें', gu: 'CSV આયાત કરો', mr: 'CSV आयात करा' },
  'buttons.export-csv':   { hi: 'CSV निर्यात करें', gu: 'CSV નિકાસ કરો', mr: 'CSV निर्यात करा' },
  'buttons.exporting':    { hi: 'निर्यात हो रहा है...', gu: 'નિકાસ થઈ રહ્યું છે...', mr: 'निर्यात होत आहे...' },
  'common.view-all':      { hi: 'सभी देखें', gu: 'બધું જુઓ', mr: 'सर्व पहा' },
  'common.actions':       { hi: 'क्रियाएँ', gu: 'ક્રિયાઓ', mr: 'क्रिया' },

  // Customer form
  'customer.add':                 { hi: 'ग्राहक जोड़ें', gu: 'ગ્રાહક ઉમેરો', mr: 'ग्राहक जोडा' },
  'customer.add.sub':             { hi: 'People में नई प्रोफ़ाइल', gu: 'People માં નવી પ્રોફાઇલ', mr: 'People मध्ये नवीन प्रोफाइल' },
  'customer.save':                { hi: 'ग्राहक सहेजें', gu: 'ગ્રાહક સાચવો', mr: 'ग्राहक जतन करा' },
  'customer.label':               { hi: 'ग्राहक', gu: 'ગ્રાહક', mr: 'ग्राहक' },
  'customer.section.identity':    { hi: 'पहचान', gu: 'ઓળખ', mr: 'ओळख' },
  'customer.section.location':    { hi: 'पता', gu: 'સ્થાન', mr: 'स्थान' },
  'customer.section.tax':         { hi: 'कर विवरण', gu: 'કર વિગતો', mr: 'कर तपशील' },
  'customer.first-name':          { hi: 'पहला नाम', gu: 'પ્રથમ નામ', mr: 'पहिले नाव' },
  'customer.first-name.placeholder': { hi: 'पहला नाम दर्ज करें', gu: 'પ્રથમ નામ દાખલ કરો', mr: 'पहिले नाव प्रविष्ट करा' },
  'customer.first-name.required': { hi: 'पहला नाम आवश्यक है', gu: 'પ્રથમ નામ જરૂરી છે', mr: 'पहिले नाव आवश्यक आहे' },
  'customer.last-name':           { hi: 'अंतिम नाम', gu: 'છેલ્લું નામ', mr: 'आडनाव' },
  'customer.last-name.placeholder': { hi: 'अंतिम नाम दर्ज करें', gu: 'છેલ્લું નામ દાખલ કરો', mr: 'आडनाव प्रविष्ट करा' },
  'customer.last-name.required':  { hi: 'अंतिम नाम आवश्यक है', gu: 'છેલ્લું નામ જરૂરી છે', mr: 'आडनाव आवश्यक आहे' },
  'customer.phone':               { hi: 'फ़ोन', gu: 'ફોન', mr: 'फोन' },
  'customer.phone.placeholder':   { hi: '10 अंकों का मोबाइल', gu: '10 અંકનો મોબાઇલ', mr: '10 अंकी मोबाइल' },
  'customer.phone.required':      { hi: 'फ़ोन नंबर आवश्यक है', gu: 'ફોન નંબર જરૂરી છે', mr: 'फोन नंबर आवश्यक आहे' },
  'customer.email':               { hi: 'ईमेल', gu: 'ઈમેલ', mr: 'ईमेल' },
  'customer.dob':                 { hi: 'जन्म तिथि', gu: 'જન્મ તારીખ', mr: 'जन्मतारीख' },
  'customer.gender':              { hi: 'लिंग', gu: 'લિંગ', mr: 'लिंग' },
  'customer.gender.male':         { hi: 'पुरुष', gu: 'પુરુષ', mr: 'पुरुष' },
  'customer.gender.female':       { hi: 'महिला', gu: 'સ્ત્રી', mr: 'स्त्री' },
  'customer.address':             { hi: 'पता', gu: 'સરનામું', mr: 'पत्ता' },
  'customer.address.placeholder': { hi: 'भवन, गली, क्षेत्र', gu: 'બિલ્ડિંગ, શેરી, વિસ્તાર', mr: 'इमारत, रस्ता, भाग' },
  'customer.city':                { hi: 'शहर', gu: 'શહેર', mr: 'शहर' },
  'customer.city.placeholder':    { hi: 'उदा. मुंबई', gu: 'ઉદા. મુંબઈ', mr: 'उदा. मुंबई' },
  'customer.city.required':       { hi: 'शहर आवश्यक है', gu: 'શહેર જરૂરી છે', mr: 'शहर आवश्यक आहे' },
  'customer.state':               { hi: 'राज्य', gu: 'રાજ્ય', mr: 'राज्य' },
  'customer.state.select':        { hi: 'राज्य चुनें', gu: 'રાજ્ય પસંદ કરો', mr: 'राज्य निवडा' },
  'customer.state-code':          { hi: 'राज्य कोड', gu: 'રાજ્ય કોડ', mr: 'राज्य कोड' },
  'customer.state-code.help':     { hi: 'राज्य से स्वतः भरा जाता है', gu: 'રાજ્યથી આપોઆપ ભરાય છે', mr: 'राज्यावरून आपोआप भरले जाते' },
  'customer.gstin':               { hi: 'GSTIN', gu: 'GSTIN', mr: 'GSTIN' },
  'customer.gstin.placeholder':   { hi: '15 अंकों का GSTIN', gu: '15 અક્ષરનો GSTIN', mr: '15 अंकी GSTIN' },
  'customer.gstin.invalid':       { hi: 'GSTIN प्रारूप अमान्य है', gu: 'GSTIN ફોર્મેટ અમાન્ય છે', mr: 'GSTIN फॉर्मॅट अवैध आहे' },
  'customer.pan':                 { hi: 'PAN', gu: 'PAN', mr: 'PAN' },
  'customer.pan.placeholder':     { hi: '10 अंकों का PAN', gu: '10 અક્ષરનો PAN', mr: '10 अंकी PAN' },
  'customer.remarks':             { hi: 'टिप्पणी', gu: 'નોંધ', mr: 'टिप्पणी' },
  'customer.remarks.placeholder': { hi: 'ग्राहक के बारे में आंतरिक नोट्स', gu: 'ગ્રાહક વિશે આંતરિક નોંધ', mr: 'ग्राहकाबद्दल अंतर्गत टिपा' },

  // Customers page
  'customers.title':             { hi: 'ग्राहक', gu: 'ગ્રાહકો', mr: 'ग्राहक' },
  'customers.search.placeholder': { hi: 'नाम, फ़ोन, शहर खोजें...', gu: 'નામ, ફોન, શહેર શોધો...', mr: 'नाव, फोन, शहर शोधा...' },
  'customers.search.aria':       { hi: 'ग्राहक खोजें', gu: 'ગ્રાહકો શોધો', mr: 'ग्राहक शोधा' },
  'customers.col.notes':         { hi: 'नोट्स', gu: 'નોંધ', mr: 'नोट्स' },
  'customers.loading':           { hi: 'ग्राहक लोड हो रहे हैं...', gu: 'ગ્રાહકો લોડ થઈ રહ્યાં છે...', mr: 'ग्राहक लोड होत आहेत...' },
  'customers.empty.title':       { hi: 'अभी तक कोई ग्राहक नहीं', gu: 'હજી સુધી કોઈ ગ્રાહકો નથી', mr: 'अद्याप ग्राहक नाहीत' },
  'customers.empty.sub':         { hi: 'ऑर्डर ट्रैक करने के लिए पहला ग्राहक जोड़ें।', gu: 'ઓર્ડરો ટ્રૅક કરવા પ્રથમ ગ્રાહક ઉમેરો.', mr: 'ऑर्डर ट्रॅक करण्यासाठी पहिला ग्राहक जोडा.' },
  'customers.add-first':         { hi: 'अपना पहला ग्राहक जोड़ें', gu: 'તમારો પ્રથમ ગ્રાહક ઉમેરો', mr: 'तुमचा पहिला ग्राहक जोडा' },

  // Product / inventory
  'product.sku':                  { hi: 'SKU', gu: 'SKU', mr: 'SKU' },
  'product.huid':                 { hi: 'HUID', gu: 'HUID', mr: 'HUID' },
  'product.hsn':                  { hi: 'HSN', gu: 'HSN', mr: 'HSN' },
  'product.description':          { hi: 'विवरण', gu: 'વર્ણન', mr: 'वर्णन' },
  'product.section.category':     { hi: 'श्रेणी', gu: 'શ્રેણી', mr: 'श्रेणी' },
  'product.section.metal-weight': { hi: 'धातु और वजन', gu: 'ધાતુ અને વજન', mr: 'धातू आणि वजन' },
  'product.section.making-wastage': { hi: 'घड़ाई और घट', gu: 'ઘડામણ અને ઘટ', mr: 'घडणी आणि घट' },
  'product.section.pricing':      { hi: 'मूल्य निर्धारण', gu: 'ભાવ', mr: 'किंमत' },
  'product.master':               { hi: 'मुख्य', gu: 'મુખ્ય', mr: 'मुख्य' },
  'product.sub':                  { hi: 'उप', gu: 'ઉપ', mr: 'उप' },
  'product.product-category':     { hi: 'उत्पाद', gu: 'ઉત્પાદન', mr: 'उत्पादन' },
  'product.purity':               { hi: 'शुद्धता', gu: 'શુદ્ધતા', mr: 'शुद्धता' },
  'product.fineness':             { hi: 'फ़ाइननेस (0-1000)', gu: 'ફાઇનનેસ (0-1000)', mr: 'फाइननेस (0-1000)' },
  'product.gross-weight':         { hi: 'कुल वजन (g)', gu: 'કુલ વજન (g)', mr: 'एकूण वजन (g)' },
  'product.gross-weight.short':   { hi: 'कुल वज़न (g)', gu: 'કુલ વ. (g)', mr: 'एकूण व. (g)' },
  'product.net-weight':           { hi: 'शुद्ध वजन (g)', gu: 'ચોખ્ખું વજન (g)', mr: 'निव्वळ वजन (g)' },
  'product.net-weight.short':     { hi: 'शुद्ध वज़न (g)', gu: 'ચોખ્ખું વ. (g)', mr: 'निव्वळ व. (g)' },
  'product.net-weight.short-noparen': { hi: 'शुद्ध वज़न', gu: 'ચોખ્ખું વ.', mr: 'निव्वळ व.' },
  'product.stone-weight':         { hi: 'रत्न वजन (g)', gu: 'સ્ટોન વજન (g)', mr: 'दगड वजन (g)' },
  'product.stone-charges':        { hi: 'रत्न शुल्क (INR)', gu: 'સ્ટોન શુલ્ક (INR)', mr: 'दगड शुल्क (INR)' },
  'product.rate-per-gram':        { hi: 'भाव / g (₹)', gu: 'ભાવ / g (₹)', mr: 'दर / g (₹)' },
  'product.making-mode':          { hi: 'घड़ाई विधि', gu: 'ઘડામણ પદ્ધતિ', mr: 'घडणी पद्धत' },
  'product.making-mode.flat':     { hi: 'फ़्लैट', gu: 'ફ્લેટ', mr: 'फ्लॅट' },
  'product.making-mode.per-gram': { hi: 'प्रति ग्राम', gu: 'પ્રતિ ગ્રામ', mr: 'प्रति ग्रॅम' },
  'product.making-mode.percent':  { hi: 'प्रतिशत', gu: 'ટકા', mr: 'टक्के' },
  'product.making-value':         { hi: 'घड़ाई मूल्य', gu: 'ઘડામણ મૂલ્ય', mr: 'घडणी मूल्य' },
  'product.wastage-percent':      { hi: 'घट %', gu: 'ઘટ %', mr: 'घट %' },
  'product.cost-price':           { hi: 'लागत मूल्य (INR)', gu: 'લાગત ભાવ (INR)', mr: 'खर्च किंमत (INR)' },
  'product.cost-price.help':      { hi: 'केवल एडमिन', gu: 'ફક્ત ઍડમિન', mr: 'फक्त ऍडमिन' },
  'product.tag-price':            { hi: 'टैग मूल्य (INR)', gu: 'ટૅગ ભાવ (INR)', mr: 'टॅग किंमत (INR)' },
  'product.tag-price.short':      { hi: 'टैग मूल्य', gu: 'ટૅગ ભાવ', mr: 'टॅग किंमत' },

  // Inventory
  'inventory.title':          { hi: 'स्टॉक', gu: 'સ્ટોક', mr: 'स्टॉक' },
  'inventory.add-product':    { hi: 'उत्पाद जोड़ें', gu: 'ઉત્પાદન ઉમેરો', mr: 'उत्पादन जोडा' },
  'inventory.search.placeholder': { hi: 'SKU, HUID, विवरण खोजें...', gu: 'SKU, HUID, વર્ણન શોધો...', mr: 'SKU, HUID, वर्णन शोधा...' },
  'inventory.search.aria':    { hi: 'उत्पाद खोजें', gu: 'ઉત્પાદનો શોધો', mr: 'उत्पादने शोधा' },
  'inventory.empty.title':    { hi: 'अभी तक कोई उत्पाद नहीं', gu: 'હજી સુધી કોઈ ઉત્પાદનો નથી', mr: 'अद्याप उत्पादने नाहीत' },
  'inventory.empty.sub':      { hi: 'स्टॉक ट्रैक करने के लिए पहला उत्पाद जोड़ें।', gu: 'સ્ટોક ટ્રૅક કરવા પ્રથમ ઉત્પાદન ઉમેરો.', mr: 'स्टॉक ट्रॅक करण्यासाठी पहिले उत्पादन जोडा.' },
  'inventory.add-first':      { hi: 'अपना पहला उत्पाद जोड़ें', gu: 'તમારું પ્રથમ ઉત્પાદન ઉમેરો', mr: 'तुमचे पहिले उत्पादन जोडा' },

  // Login
  'login.hero.eyebrow':   { hi: 'जौहरियों के लिए आधुनिक POS', gu: 'ઝવેરીઓ માટે આધુનિક POS', mr: 'सराफांसाठी आधुनिक POS' },
  'login.hero.title':     {
    hi: 'बिल जो काउंटर <x id="START_EMPHASISED_TEXT" ctype="x-em" equiv-text="&lt;em&gt;"/>तेज़ी<x id="CLOSE_EMPHASISED_TEXT" ctype="x-em" equiv-text="&lt;/em&gt;"/> से क्लियर करते हैं।',
    gu: 'બિલ કે જે કાઉન્ટર <x id="START_EMPHASISED_TEXT" ctype="x-em" equiv-text="&lt;em&gt;"/>ઝડપી<x id="CLOSE_EMPHASISED_TEXT" ctype="x-em" equiv-text="&lt;/em&gt;"/> ક્લિયર કરે છે.',
    mr: 'बिले जी काउंटर <x id="START_EMPHASISED_TEXT" ctype="x-em" equiv-text="&lt;em&gt;"/>वेगाने<x id="CLOSE_EMPHASISED_TEXT" ctype="x-em" equiv-text="&lt;/em&gt;"/> क्लियर करतात.',
  },
  'login.hero.body':      { hi: 'गर्म, कीबोर्ड-प्रथम, ऑफ़लाइन-तैयार। उन दुकानों के लिए बनाया गया जो शुद्धता से कीमत तय करती हैं।', gu: 'હૂંફાળું, કીબોર્ડ-પ્રથમ, ઑફલાઇન-તૈયાર. જે દુકાનો શુદ્ધતાથી ભાવ નક્કી કરે છે.', mr: 'उबदार, कीबोर्ड-प्रथम, ऑफलाइन-तयार. जी दुकाने शुद्धतेने किंमत ठरवतात.' },
  'login.local-first':    { hi: 'लोकल-प्रथम · कोई क्लाउड लॉक-इन नहीं', gu: 'લોકલ-પ્રથમ · કોઈ ક્લાઉડ લોક-ઇન નહીં', mr: 'लोकल-प्रथम · क्लाउड लॉक-इन नाही' },
  'login.sign-in':        { hi: 'साइन इन', gu: 'સાઇન ઇન', mr: 'साइन इन' },
  'login.signing-in':     { hi: 'साइन इन हो रहा है...', gu: 'સાઇન ઇન થઈ રહ્યું છે...', mr: 'साइन इन होत आहे...' },
  'login.sub':            { hi: 'जारी रखने के लिए अपने शॉप खाते का उपयोग करें।', gu: 'આગળ વધવા તમારા શોપ ખાતાનો ઉપયોગ કરો.', mr: 'सुरू ठेवण्यासाठी तुमचा शॉप खाते वापरा.' },
  'login.username':       { hi: 'यूज़रनेम', gu: 'યુઝરનેમ', mr: 'यूजरनेम' },
  'login.username.placeholder': { hi: 'उदा. shop.admin', gu: 'ઉદા. shop.admin', mr: 'उदा. shop.admin' },
  'login.password':       { hi: 'पासवर्ड', gu: 'પાસવર્ડ', mr: 'पासवर्ड' },
  'login.password.placeholder': { hi: 'अपना पासवर्ड दर्ज करें', gu: 'તમારો પાસવર્ડ દાખલ કરો', mr: 'तुमचा पासवर्ड प्रविष्ट करा' },
  'login.forgot':         { hi: 'भूल गए?', gu: 'ભૂલી ગયા?', mr: 'विसरलात?' },
  'login.device-only':    { hi: 'आप केवल इस डिवाइस पर साइन इन हैं।', gu: 'તમે માત્ર આ ડિવાઇસ પર સાઇન ઇન છો.', mr: 'तुम्ही फक्त या डिव्हाइसवर साइन इन आहात.' },

  // Orders
  'orders.title':         { hi: 'बही', gu: 'ચોપડા', mr: 'चोपडा' },
  'orders.empty':         { hi: 'अभी तक कोई बिल नहीं', gu: 'હજી સુધી કોઈ બિલ નથી', mr: 'अद्याप बिले नाहीत' },
  'orders.new-invoice':   { hi: 'नया बिल', gu: 'નવું બિલ', mr: 'नवीन बिल' },
  'orders.create-first':  { hi: 'अपना पहला बिल बनाएं', gu: 'તમારું પ્રથમ બિલ બનાવો', mr: 'तुमचे पहिले बिल तयार करा' },
  'orders.search.placeholder': { hi: 'बिल नंबर या ग्राहक खोजें...', gu: 'બિલ નંબર અથવા ગ્રાહક શોધો...', mr: 'बिल क्रमांक किंवा ग्राहक शोधा...' },
  'orders.date.from':     { hi: 'से दिनांक', gu: 'થી તારીખ', mr: 'पासून दिनांक' },
  'orders.date.to':       { hi: 'तक दिनांक', gu: 'સુધી તારીખ', mr: 'पर्यंत दिनांक' },
  'orders.filter.all':    { hi: 'सभी', gu: 'બધું', mr: 'सर्व' },
  'orders.filter.paid':   { hi: 'भुगतान हुआ', gu: 'ચૂકવેલ', mr: 'भरलेले' },
  'orders.filter.unpaid': { hi: 'बकाया', gu: 'બાકી', mr: 'बाकी' },
  'orders.filter.cancelled': { hi: 'रद्द', gu: 'રદ', mr: 'रद्द' },
  'orders.col.invoice-no': { hi: 'बिल #', gu: 'બિલ #', mr: 'बिल #' },
  'orders.col.date':      { hi: 'दिनांक', gu: 'તારીખ', mr: 'दिनांक' },
  'orders.col.items':     { hi: 'आइटम', gu: 'આઇટમ', mr: 'आयटम' },
  'orders.col.amount':    { hi: 'राशि', gu: 'રકમ', mr: 'रक्कम' },
  'orders.col.status':    { hi: 'स्थिति', gu: 'સ્થિતિ', mr: 'स्थिती' },
  'orders.status.paid':      { hi: 'भुगतान हुआ', gu: 'ચૂકવેલ', mr: 'भरलेले' },
  'orders.status.unpaid':    { hi: 'बकाया', gu: 'બાકી', mr: 'बाकी' },
  'orders.status.cancelled': { hi: 'रद्द', gu: 'રદ', mr: 'रद्द' },
  'orders.action.view':      { hi: 'बिल देखें', gu: 'બિલ જુઓ', mr: 'बिल पहा' },
  'orders.action.print':     { hi: 'बिल प्रिंट करें', gu: 'બિલ પ્રિન્ટ કરો', mr: 'बिल प्रिंट करा' },
  'orders.action.cancel':    { hi: 'बिल रद्द करें', gu: 'બિલ રદ કરો', mr: 'बिल रद्द करा' },

  // Cart / cart-builder
  'cart.title':               { hi: 'कार्ट', gu: 'કાર્ટ', mr: 'कार्ट' },
  'cart.close':               { hi: 'कार्ट बंद करें', gu: 'કાર્ટ બંધ કરો', mr: 'कार्ट बंद करा' },
  'cart.go-to-sell':          { hi: 'बिक्री पर जाएं', gu: 'વેચાણ પર જાઓ', mr: 'विक्रीकडे जा' },
  'cart.search.placeholder':  { hi: 'SKU, HUID या उत्पाद नाम खोजें  (/ या स्कैन करें)', gu: 'SKU, HUID અથવા ઉત્પાદન નામ શોધો  (/ અથવા સ્કૅન કરો)', mr: 'SKU, HUID किंवा उत्पादन नाव शोधा  (/ किंवा स्कॅन करा)' },
  'cart.empty.title':         { hi: 'कार्ट खाली है।', gu: 'કાર્ટ ખાલી છે.', mr: 'कार्ट रिकामी आहे.' },
  'cart.empty.sub':           { hi: 'आइटम जोड़ने के लिए SKU या उत्पाद नाम टाइप करें, या बारकोड स्कैन करें।', gu: 'આઇટમ ઉમેરવા SKU અથવા ઉત્પાદન નામ ટાઇપ કરો, અથવા બારકોડ સ્કૅન કરો.', mr: 'आयटम जोडण्यासाठी SKU किंवा उत्पादन नाव टाइप करा, किंवा बारकोड स्कॅन करा.' },
  'cart.discount':            { hi: 'छूट (₹)', gu: 'ડિસ્કાઉન્ટ (₹)', mr: 'सूट (₹)' },
  'cart.line-total':          { hi: 'लाइन कुल', gu: 'લાઇન કુલ', mr: 'लाइन एकूण' },
  'cart.old-gold-exchange':   { hi: 'पुराने सोने का विनिमय', gu: 'જૂનું સોનું બદલી', mr: 'जुने सोने बदल' },
  'cart.rate-lock':           { hi: 'भाव लॉक', gu: 'ભાવ લોક', mr: 'दर लॉक' },
  'cart.rate-refresh':        { hi: 'भाव रीफ़्रेश करें', gu: 'ભાવ રિફ્રેશ કરો', mr: 'दर रिफ्रेश करा' },
  'cart.rate-refresh.title':  { hi: 'नवीनतम भाव लाएं', gu: 'નવીનતમ ભાવ મેળવો', mr: 'नवीनतम दर आणा' },
  'cart.no-rates':            { hi: 'फ़ाइल में कोई धातु भाव नहीं — सेटिंग्स में आज का भाव जोड़ें।', gu: 'ફાઇલમાં કોઈ ધાતુ ભાવ નથી — સેટિંગ્સમાં આજનો ભાવ ઉમેરો.', mr: 'फाइलमध्ये धातू दर नाहीत — सेटिंग्जमध्ये आजचा दर जोडा.' },
  'cart.totals':              { hi: 'कुल योग', gu: 'કુલ', mr: 'एकूण' },
  'cart.redeem-scheme':       { hi: 'बचत योजना का उपयोग करें', gu: 'બચત યોજના રિડીમ કરો', mr: 'बचत योजना वापरा' },
  'cart.apply-scheme':        { hi: 'योजना लागू करें →', gu: 'યોજના લાગુ કરો →', mr: 'योजना लागू करा →' },

  // Totals
  'totals.metal':                  { hi: 'धातु', gu: 'ધાતુ', mr: 'धातू' },
  'totals.metal-value':            { hi: 'धातु मूल्य', gu: 'ધાતુ મૂલ્ય', mr: 'धातू मूल्य' },
  'totals.making':                 { hi: 'घड़ाई', gu: 'ઘડામણ', mr: 'घडणी' },
  'totals.wastage':                { hi: 'घट', gu: 'ઘટ', mr: 'घट' },
  'totals.stone':                  { hi: 'रत्न', gu: 'સ્ટોન', mr: 'दगड' },
  'totals.subtotal-taxable':       { hi: 'उप-योग (कर योग्य)', gu: 'સબટોટલ (કરપાત્ર)', mr: 'उप-एकूण (करपात्र)' },
  'totals.discount':               { hi: 'छूट', gu: 'ડિસ્કાઉન્ટ', mr: 'सूट' },
  'totals.old-gold-credit':        { hi: 'पुराने सोने का क्रेडिट', gu: 'જૂના સોનાનો ક્રેડિટ', mr: 'जुन्या सोन्याचे क्रेडिट' },
  'totals.igst':                   { hi: 'IGST', gu: 'IGST', mr: 'IGST' },
  'totals.cgst':                   { hi: 'CGST', gu: 'CGST', mr: 'CGST' },
  'totals.sgst':                   { hi: 'SGST', gu: 'SGST', mr: 'SGST' },
  'totals.round-off':              { hi: 'राउंड-ऑफ', gu: 'રાઉન્ડ-ઓફ', mr: 'राउंड-ऑफ' },
  'totals.grand-total':            { hi: 'कुल राशि', gu: 'કુલ રકમ', mr: 'एकूण रक्कम' },
  'totals.payable-after-scheme':   { hi: 'योजना के बाद देय', gu: 'યોજના પછી ચૂકવવાપાત્ર', mr: 'योजना नंतर देय' },

  // Old gold
  'old-gold.tested-purity':    { hi: 'परखी हुई शुद्धता', gu: 'ચકાસાયેલ શુદ્ધતા', mr: 'तपासलेली शुद्धता' },
  'old-gold.deduction-percent': { hi: 'कटौती %', gu: 'કપાત %', mr: 'कपात %' },
  'old-gold.credit':           { hi: 'क्रेडिट', gu: 'ક્રેડિટ', mr: 'क्रेडिट' },
  'old-gold.update-receipt':   { hi: 'रसीद अपडेट करें', gu: 'રસીદ અપડેટ કરો', mr: 'पावती अपडेट करा' },
  'old-gold.add-to-invoice':   { hi: 'बिल में जोड़ें', gu: 'બિલમાં ઉમેરો', mr: 'बिलात जोडा' },
  'old-gold.edit.title':       { hi: 'पुराने सोने की रसीद संपादित करें', gu: 'જૂના સોનાની રસીદ સંપાદિત કરો', mr: 'जुन्या सोन्याची पावती संपादित करा' },

  // Scheme
  'scheme.plan-name':      { hi: 'योजना का नाम', gu: 'યોજનાનું નામ', mr: 'योजनेचे नाव' },
  'scheme.monthly-amount': { hi: 'मासिक राशि', gu: 'માસિક રકમ', mr: 'मासिक रक्कम' },
  'scheme.tenure':         { hi: 'अवधि (महीने)', gu: 'સમયગાળો (મહિનાઓ)', mr: 'कालावधी (महिने)' },
  'scheme.enroll':         { hi: 'योजना में नामांकन', gu: 'યોજનામાં નોંધણી', mr: 'योजनेत नोंदणी' },

  // Reports
  'reports.title':  { hi: 'रिपोर्ट', gu: 'અહેવાલો', mr: 'अहवाल' },

  // Settings
  'settings.title':      { hi: 'सेटिंग्स', gu: 'સેટિંગ્સ', mr: 'सेटिंग्ज' },
  'settings.shop.sub':   { hi: 'हर बिल, रसीद और निर्यात पर दिखाई देता है।', gu: 'દરેક બિલ, રસીદ અને નિકાસ પર દેખાય છે.', mr: 'प्रत्येक बिल, पावती आणि निर्यातावर दिसते.' },
  'settings.tab.shop':      { hi: 'दुकान पहचान', gu: 'દુકાન ઓળખ', mr: 'दुकान ओळख' },
  'settings.tab.tax':       { hi: 'कर और बिल', gu: 'કર અને બિલ', mr: 'कर आणि बिल' },
  'settings.tab.rates':     { hi: 'धातु भाव', gu: 'ધાતુ ભાવ', mr: 'धातू दर' },
  'settings.tab.print':     { hi: 'प्रिंट और हार्डवेयर', gu: 'પ્રિન્ટ અને હાર્ડવેર', mr: 'प्रिंट आणि हार्डवेअर' },
  'settings.tab.backup':    { hi: 'बैकअप', gu: 'બૅકઅપ', mr: 'बॅकअप' },
  'settings.tab.users':     { hi: 'उपयोगकर्ता और अनुमतियां', gu: 'વપરાશકર્તાઓ અને પરવાનગીઓ', mr: 'वापरकर्ते आणि परवानग्या' },
  'settings.tab.migration': { hi: 'माइग्रेशन', gu: 'માઇગ્રેશન', mr: 'माइग्रेशन' },
  'settings.tab.whatsapp':  { hi: 'व्हाट्सएप', gu: 'વ્હોટ્સએપ', mr: 'व्हॉट्सॲप' },
  'settings.tab.whatsapp-activity': { hi: 'व्हाट्सएप गतिविधि', gu: 'વ્હોટ્સએપ પ્રવૃત્તિ', mr: 'व्हॉट्सॲप क्रियाकलाप' },
  'settings.tab.language':  { hi: 'भाषा', gu: 'ભાષા', mr: 'भाषा' },
  'settings.tab.database':  { hi: 'डेटाबेस', gu: 'ડેટાબેઝ', mr: 'डेटाबेस' },
  'settings.language.title':      { hi: 'भाषा', gu: 'ભાષા', mr: 'भाषा' },
  'settings.language.sub':        { hi: 'ऐप इंटरफ़ेस के लिए भाषा चुनें। परिवर्तन रीस्टार्ट के बाद प्रभावी होंगे।', gu: 'એપ ઇન્ટરફેસ માટે ભાષા પસંદ કરો. ફેરફારો રીસ્ટાર્ટ પછી અસર કરશે.', mr: 'ॲप इंटरफेससाठी भाषा निवडा. बदल रीस्टार्ट नंतर लागू होतील.' },
  'settings.language.current':    { hi: 'वर्तमान भाषा', gu: 'વર્તમાન ભાષા', mr: 'सध्याची भाषा' },
  'settings.language.requested':  { hi: 'अनुरोधित भाषा', gu: 'વિનંતી કરેલ ભાષા', mr: 'विनंती केलेली भाषा' },
  'settings.language.restart-note': { hi: 'भाषा पैक: अंग्रेज़ी (डिफ़ॉल्ट), हिंदी, गुजराती, मराठी। बचाने के बाद अलग भाषा बंडल सक्रिय करने के लिए ऐप बंद करें और फिर से लॉन्च करें।', gu: 'ભાષા પૅક્સ: અંગ્રેજી (ડિફૉલ્ટ), હિન્દી, ગુજરાતી, મરાઠી. સાચવ્યા પછી અલગ ભાષા બંડલ સક્રિય કરવા ઍપ બંધ કરીને ફરી લોન્ચ કરો.', mr: 'भाषा पॅक: इंग्रजी (डिफॉल्ट), हिंदी, गुजराती, मराठी. जतन केल्यानंतर वेगळे भाषा बंडल सक्रिय करण्यासाठी ॲप बंद करून पुन्हा सुरू करा.' },
  'settings.language.save':       { hi: 'प्राथमिकता सहेजें', gu: 'પસંદગી સાચવો', mr: 'प्राधान्य जतन करा' },
  'settings.language.saved-toast': { hi: 'प्राथमिकता सहेजी गई। नई भाषा लागू करने के लिए ऐप बंद करें और फिर से खोलें।', gu: 'પસંદગી સાચવાઈ. નવી ભાષા લાગુ કરવા ઍપ બંધ કરીને ફરી ખોલો.', mr: 'प्राधान्य जतन झाले. नवीन भाषा लागू करण्यासाठी ॲप बंद करून पुन्हा उघडा.' },

  // Rail / top bar (previously untranslated)
  'rail.brand':        { hi: 'Radiance', gu: 'Radiance', mr: 'Radiance' },
  'rail-drawer.close': { hi: 'नेविगेशन बंद करें', gu: 'નેવિગેશન બંધ કરો', mr: 'नेव्हिगेशन बंद करा' },
  'topbar.menu.aria':  { hi: 'नेविगेशन खोलें', gu: 'નેવિગેશન ખોલો', mr: 'नेव्हिगेशन उघडा' },

  // Dashboard tour trigger
  'dashboard.take-tour': { hi: 'टूर लें', gu: 'ટૂર લો', mr: 'टूर घ्या' },

  // Settings → Appearance
  'settings.tab.appearance':               { hi: 'रूप-रंग', gu: 'દેખાવ', mr: 'स्वरूप' },
  'settings.appearance.title':             { hi: 'रूप-रंग', gu: 'દેખાવ', mr: 'स्वरूप' },
  'settings.appearance.sub':               { hi: 'एक टाइपोग्राफ़ी प्रीसेट चुनें। पूरे ऐप में तुरंत लागू होता है; रीस्टार्ट के बाद बनाए रखने के लिए सहेजें।', gu: 'એક ટાઇપોગ્રાફી પ્રીસેટ પસંદ કરો. આખી ઍપમાં તરત જ લાગુ થાય છે; રીસ્ટાર્ટ પછી જાળવવા સાચવો.', mr: 'एक टायपोग्राफी प्रीसेट निवडा. संपूर्ण ॲपमध्ये त्वरित लागू होते; रीस्टार्ट नंतर टिकवण्यासाठी जतन करा.' },
  'settings.appearance.typography-heading': { hi: 'टाइपोग्राफ़ी', gu: 'ટાઇપોગ્રાફી', mr: 'टायपोग्राफी' },
  'settings.appearance.preview-caption':   { hi: 'कुल योग', gu: 'કુલ સરવાળો', mr: 'एकूण बेरीज' },
  'settings.appearance.cancel':            { hi: 'रद्द करें', gu: 'રદ કરો', mr: 'रद्द करा' },
  'settings.appearance.save':              { hi: 'सहेजें और लागू करें', gu: 'સાચવો અને લાગુ કરો', mr: 'जतन करा आणि लागू करा' },
  'settings.appearance.setup-heading':     { hi: 'सेटअप गाइड', gu: 'સેટઅપ ગાઇડ', mr: 'सेटअप मार्गदर्शक' },
  'settings.appearance.setup-sub':         { hi: 'अपनी दुकान का विवरण देखने के लिए पहली बार वाला सेटअप गाइड फिर से चलाएं। आपका मौजूदा डेटा बना रहता है — कुछ भी नहीं हटाया जाता।', gu: 'તમારી દુકાનની વિગતો સમીક્ષા કરવા પ્રથમ-વખતની સેટઅપ ગાઇડ ફરી ચલાવો. તમારો હાલનો ડેટા રહે છે — કંઈ કાઢી નાખવામાં આવતું નથી.', mr: 'तुमच्या दुकानाचे तपशील पाहण्यासाठी पहिल्यांदाचा सेटअप मार्गदर्शक पुन्हा चालवा. तुमचा विद्यमान डेटा राहतो — काहीही हटवले जात नाही.' },
  'settings.appearance.replay-setup':      { hi: 'सेटअप गाइड फिर से चलाएं', gu: 'સેટઅપ ગાઇડ ફરી ચલાવો', mr: 'सेटअप मार्गदर्शक पुन्हा चालवा' },
  'settings.appearance.replay-tour':       { hi: 'ऐप टूर फिर से चलाएं', gu: 'ઍપ ટૂર ફરી ચલાવો', mr: 'ॲप टूर पुन्हा चालवा' },
  'settings.appearance.sample-sub':        { hi: 'अभी नमूना डेटा लोड है। असली लेन-देन दर्ज करने से पहले इसे हटा दें — आपकी दुकान सेटिंग्स और स्टाफ लॉगिन बने रहेंगे।', gu: 'હાલમાં નમૂના ડેટા લોડ છે. વાસ્તવિક વ્યવહારો દાખલ કરતા પહેલા તેને દૂર કરો — તમારી દુકાન સેટિંગ્સ અને સ્ટાફ લોગિન રહેશે.', mr: 'सध्या नमुना डेटा लोड आहे. खरे व्यवहार प्रविष्ट करण्यापूर्वी तो काढा — तुमच्या दुकान सेटिंग्ज आणि कर्मचारी लॉगिन राहतील.' },
  'settings.appearance.remove-sample':     { hi: 'नमूना डेटा हटाएं', gu: 'નમૂના ડેટા દૂર કરો', mr: 'नमुना डेटा काढा' },

  // Onboarding wizard
  'onboarding.brand':          { hi: 'ज्वेलरी स्टोर मैनेजर', gu: 'જ્વેલરી સ્ટોર મેનેજર', mr: 'ज्वेलरी स्टोअर मॅनेजर' },
  'onboarding.back':           { hi: 'पीछे', gu: 'પાછળ', mr: 'मागे' },
  'onboarding.continue':       { hi: 'जारी रखें', gu: 'ચાલુ રાખો', mr: 'सुरू ठेवा' },
  'onboarding.goToDashboard':  { hi: 'डैशबोर्ड पर जाएं', gu: 'ડૅશબોર્ડ પર જાઓ', mr: 'डॅशबोर्डवर जा' },
  'onboarding.welcome.title':  { hi: 'स्वागत है — चलिए आपकी दुकान सेटअप करें', gu: 'સ્વાગત છે — ચાલો તમારી દુકાન સેટઅપ કરીએ', mr: 'स्वागत आहे — चला तुमची दुकान सेटअप करूया' },
  'onboarding.welcome.subtitle': { hi: 'कुछ आसान चरण और आप अपनी पहली बिक्री का बिल बनाने के लिए तैयार होंगे। सब कुछ इसी कंप्यूटर पर रहता है — इंटरनेट की आवश्यकता नहीं।', gu: 'થોડા ઝડપી પગલાં અને તમે તમારું પહેલું વેચાણ બિલ કરવા તૈયાર થશો. બધું આ કમ્પ્યુટર પર જ રહે છે — ઇન્ટરનેટની જરૂર નથી.', mr: 'काही झटपट पायऱ्या आणि तुम्ही तुमची पहिली विक्री बिल करण्यास तयार व्हाल. सर्व काही याच संगणकावर राहते — इंटरनेटची गरज नाही.' },
  'onboarding.welcome.point1': { hi: 'नए पासवर्ड से अपना खाता सुरक्षित करें', gu: 'નવા પાસવર્ડથી તમારું ખાતું સુરક્ષિત કરો', mr: 'नवीन पासवर्डने तुमचे खाते सुरक्षित करा' },
  'onboarding.welcome.point2': { hi: 'GST बिलों के लिए अपनी दुकान का विवरण जोड़ें', gu: 'GST બિલો માટે તમારી દુકાનની વિગતો ઉમેરો', mr: 'GST बिलांसाठी तुमच्या दुकानाचे तपशील जोडा' },
  'onboarding.welcome.point3': { hi: 'बिक्री शुरू करें', gu: 'વેચાણ શરૂ કરો', mr: 'विक्री सुरू करा' },
  'onboarding.password.title':    { hi: 'अपना खाता सुरक्षित करें', gu: 'તમારું ખાતું સુરક્ષિત કરો', mr: 'तुमचे खाते सुरक्षित करा' },
  'onboarding.password.subtitle': { hi: 'आप डिफ़ॉल्ट पासवर्ड से साइन इन हैं। अपने डेटा की सुरक्षा के लिए एक नया पासवर्ड सेट करें।', gu: 'તમે ડિફૉલ્ટ પાસવર્ડથી સાઇન ઇન છો. તમારા ડેટાની સુરક્ષા માટે નવો પાસવર્ડ સેટ કરો.', mr: 'तुम्ही डिफॉल्ट पासवर्डने साइन इन आहात. तुमच्या डेटाच्या सुरक्षेसाठी नवीन पासवर्ड सेट करा.' },
  'onboarding.password.new':      { hi: 'नया पासवर्ड', gu: 'નવો પાસવર્ડ', mr: 'नवीन पासवर्ड' },
  'onboarding.password.newError': { hi: 'कम से कम 6 अक्षर का उपयोग करें।', gu: 'ઓછામાં ઓછા 6 અક્ષરો વાપરો.', mr: 'किमान 6 अक्षरे वापरा.' },
  'onboarding.password.confirm':  { hi: 'पासवर्ड की पुष्टि करें', gu: 'પાસવર્ડની પુષ્ટિ કરો', mr: 'पासवर्डची पुष्टी करा' },
  'onboarding.password.mismatch': { hi: 'पासवर्ड मेल नहीं खाते।', gu: 'પાસવર્ડ મેળ ખાતા નથી.', mr: 'पासवर्ड जुळत नाहीत.' },
  'onboarding.shop.title':    { hi: 'आपकी दुकान', gu: 'તમારી દુકાન', mr: 'तुमची दुकान' },
  'onboarding.shop.subtitle': { hi: 'ये विवरण हर GST बिल पर दिखाई देते हैं। आप इन्हें बाद में सेटिंग्स में बदल सकते हैं।', gu: 'આ વિગતો દરેક GST બિલ પર દેખાય છે. તમે તેને પછીથી સેટિંગ્સમાં બદલી શકો છો.', mr: 'हे तपशील प्रत्येक GST बिलावर दिसतात. तुम्ही ते नंतर सेटिंग्जमध्ये बदलू शकता.' },
  'onboarding.shop.name':     { hi: 'दुकान का नाम', gu: 'દુકાનનું નામ', mr: 'दुकानाचे नाव' },
  'onboarding.shop.address1': { hi: 'पता पंक्ति 1', gu: 'સરનામું લાઇન 1', mr: 'पत्ता ओळ 1' },
  'onboarding.shop.address2': { hi: 'पता पंक्ति 2 (वैकल्पिक)', gu: 'સરનામું લાઇન 2 (વૈકલ્પિક)', mr: 'पत्ता ओळ 2 (पर्यायी)' },
  'onboarding.shop.city':     { hi: 'शहर', gu: 'શહેર', mr: 'शहर' },
  'onboarding.shop.pincode':  { hi: 'पिनकोड', gu: 'પિનકોડ', mr: 'पिनकोड' },
  'onboarding.shop.state':    { hi: 'राज्य', gu: 'રાજ્ય', mr: 'राज्य' },
  'onboarding.shop.statePlaceholder': { hi: 'राज्य चुनें', gu: 'રાજ્ય પસંદ કરો', mr: 'राज्य निवडा' },
  'onboarding.shop.stateCode': { hi: 'राज्य कोड', gu: 'રાજ્ય કોડ', mr: 'राज्य कोड' },
  'onboarding.shop.phone':    { hi: 'फ़ोन', gu: 'ફોન', mr: 'फोन' },
  'onboarding.shop.email':    { hi: 'ईमेल (वैकल्पिक)', gu: 'ઈમેલ (વૈકલ્પિક)', mr: 'ईमेल (पर्यायी)' },
  'onboarding.shop.gstin':    { hi: 'GSTIN', gu: 'GSTIN', mr: 'GSTIN' },
  'onboarding.shop.gstinError': { hi: 'मान्य 15-अंकीय GSTIN दर्ज करें।', gu: 'માન્ય 15-અક્ષરનો GSTIN દાખલ કરો.', mr: 'वैध 15-अक्षरी GSTIN प्रविष्ट करा.' },
  'onboarding.shop.pan':      { hi: 'PAN (वैकल्पिक)', gu: 'PAN (વૈકલ્પિક)', mr: 'PAN (पर्यायी)' },
  'onboarding.finish.title':    { hi: 'आप तैयार हैं', gu: 'તમે તૈયાર છો', mr: 'तुम्ही तयार आहात' },
  'onboarding.finish.subtitle': { hi: 'आपकी दुकान तैयार है। इसके बाद, आज का धातु भाव लॉक करें और डैशबोर्ड से अपना पहला उत्पाद जोड़ें — फिर आप अपनी पहली बिक्री का बिल बना सकते हैं।', gu: 'તમારી દુકાન તૈયાર છે. હવે, આજનો ધાતુ ભાવ લોક કરો અને ડૅશબોર્ડમાંથી તમારું પહેલું ઉત્પાદન ઉમેરો — પછી તમે તમારું પહેલું વેચાણ બિલ કરી શકો છો.', mr: 'तुमची दुकान तयार आहे. पुढे, आजचा धातू दर लॉक करा आणि डॅशबोर्डवरून तुमचे पहिले उत्पादन जोडा — मग तुम्ही तुमची पहिली विक्री बिल करू शकता.' },
  'onboarding.finish.sample-prompt':  { hi: 'पहले देखना चाहते हैं? नमूना उत्पाद, ग्राहक और बिक्री का एक छोटा सेट लोड करें। आप इसे सेटिंग्स से कभी भी हटा सकते हैं।', gu: 'પહેલા જોવા માંગો છો? નમૂના ઉત્પાદનો, ગ્રાહકો અને વેચાણનો નાનો સેટ લોડ કરો. તમે તેને સેટિંગ્સમાંથી ગમે ત્યારે દૂર કરી શકો છો.', mr: 'आधी पाहू इच्छिता? नमुना उत्पादने, ग्राहक आणि विक्रीचा एक छोटा संच लोड करा. तुम्ही तो सेटिंग्जमधून कधीही काढू शकता.' },
  'onboarding.finish.sample-cta':     { hi: 'नमूना डेटा के साथ देखें', gu: 'નમૂના ડેટા સાથે અન્વેષણ કરો', mr: 'नमुना डेटासह पाहा' },
  'onboarding.finish.sample-loading': { hi: 'नमूना डेटा लोड हो रहा है…', gu: 'નમૂના ડેટા લોડ થઈ રહ્યો છે…', mr: 'नमुना डेटा लोड होत आहे…' },

  // Dashboard setup checklist
  'checklist.eyebrow':       { hi: 'शुरू करें', gu: 'શરૂ કરો', mr: 'सुरू करा' },
  'checklist.heading':       { hi: 'अपनी दुकान सेटअप पूरा करें', gu: 'તમારી દુકાન સેટઅપ પૂર્ણ કરો', mr: 'तुमची दुकान सेटअप पूर्ण करा' },
  'checklist.dismiss':       { hi: 'चेकलिस्ट बंद करें', gu: 'ચેકલિસ્ટ બંધ કરો', mr: 'चेकलिस्ट बंद करा' },
  'checklist.do-it':         { hi: 'करें', gu: 'કરો', mr: 'करा' },
  'checklist.done':          { hi: 'पूर्ण', gu: 'પૂર્ણ', mr: 'पूर्ण' },
  'checklist.item.rate':     { hi: 'आज का धातु भाव लॉक करें', gu: 'આજનો ધાતુ ભાવ લોક કરો', mr: 'आजचा धातू दर लॉक करा' },
  'checklist.item.product':  { hi: 'अपना पहला उत्पाद जोड़ें', gu: 'તમારું પહેલું ઉત્પાદન ઉમેરો', mr: 'तुमचे पहिले उत्पादन जोडा' },
  'checklist.item.customer': { hi: 'अपना पहला ग्राहक जोड़ें', gu: 'તમારો પહેલો ગ્રાહક ઉમેરો', mr: 'तुमचा पहिला ग्राहक जोडा' },
  'checklist.item.sale':     { hi: 'अपनी पहली बिक्री दर्ज करें', gu: 'તમારું પહેલું વેચાણ નોંધો', mr: 'तुमची पहिली विक्री नोंदवा' },

  // Product tour (driver.js)
  'tour.welcome.title':   { hi: 'आपकी दुकान में आपका स्वागत है', gu: 'તમારી દુકાનમાં આપનું સ્વાગત છે', mr: 'तुमच्या दुकानात स्वागत आहे' },
  'tour.welcome.desc':    { hi: 'चीज़ें कहां हैं इसका एक त्वरित टूर। आप इसे सेटिंग्स से कभी भी दोबारा चला सकते हैं।', gu: 'વસ્તુઓ ક્યાં છે તેનો ઝડપી ટૂર. તમે તેને સેટિંગ્સમાંથી ગમે ત્યારે ફરી ચલાવી શકો છો.', mr: 'गोष्टी कुठे आहेत याचा झटपट टूर. तुम्ही तो सेटिंग्जमधून कधीही पुन्हा चालवू शकता.' },
  'tour.checklist.title': { hi: 'आपकी सेटअप चेकलिस्ट', gu: 'તમારી સેટઅપ ચેકલિસ્ટ', mr: 'तुमची सेटअप चेकलिस्ट' },
  'tour.checklist.desc':  { hi: 'शुरू करने के लिए ये चरण पूरे करें। सब कुछ हो जाने पर यह गायब हो जाता है।', gu: 'શરૂ કરવા આ પગલાં પૂર્ણ કરો. બધું થઈ ગયા પછી તે અદૃશ્ય થઈ જાય છે.', mr: 'सुरू करण्यासाठी या पायऱ्या पूर्ण करा. सर्व झाल्यावर ते नाहीसे होते.' },
  'tour.rate.title':      { hi: 'दैनिक भाव लॉक करें', gu: 'દૈનિક ભાવ લોક કરો', mr: 'दैनिक दर लॉक करा' },
  'tour.rate.desc':       { hi: 'हर सुबह यहां आज का सोने का भाव सेट करें — हर बिल इसका उपयोग करता है।', gu: 'દરરોજ સવારે અહીં આજનો સોનાનો ભાવ સેટ કરો — દરેક બિલ તેનો ઉપયોગ કરે છે.', mr: 'दररोज सकाळी येथे आजचा सोन्याचा दर सेट करा — प्रत्येक बिल तो वापरते.' },
  'tour.invoices.title':  { hi: 'हाल की बिक्री', gu: 'તાજેતરનું વેચાણ', mr: 'अलीकडील विक्री' },
  'tour.invoices.desc':   { hi: 'आपके नवीनतम बिल यहां दिखते हैं। खोलने के लिए किसी भी पंक्ति पर क्लिक करें।', gu: 'તમારા તાજેતરના બિલો અહીં દેખાય છે. ખોલવા કોઈપણ પંક્તિ પર ક્લિક કરો.', mr: 'तुमची अलीकडील बिले येथे दिसतात. उघडण्यासाठी कोणत्याही ओळीवर क्लिक करा.' },
  'tour.kpis.title':      { hi: 'मुख्य आंकड़े', gu: 'મુખ્ય આંકડા', mr: 'मुख्य आकडे' },
  'tour.kpis.desc':       { hi: 'ग्राहक, स्टॉक और बकाया भुगतान एक नज़र में।', gu: 'ગ્રાહકો, સ્ટોક અને બાકી ચૂકવણી એક નજરમાં.', mr: 'ग्राहक, स्टॉक आणि प्रलंबित पेमेंट एका दृष्टिक्षेपात.' },
  'tour.next':            { hi: 'आगे', gu: 'આગળ', mr: 'पुढे' },
  'tour.prev':            { hi: 'पीछे', gu: 'પાછળ', mr: 'मागे' },
  'tour.done':            { hi: 'पूर्ण', gu: 'પૂર્ણ', mr: 'पूर्ण' },
};

// Parse messages.xlf to extract every trans-unit id + source.
// Simple regex parser — the XML is well-formed and Angular's format is fixed.
const unitRe = /<trans-unit id="([^"]+)" datatype="html">([\s\S]*?)<\/trans-unit>/g;
const sourceRe = /<source>([\s\S]*?)<\/source>/;

const units = [];
let m;
while ((m = unitRe.exec(source)) !== null) {
  const id = m[1];
  const body = m[2];
  const s = body.match(sourceRe);
  units.push({ id, source: s ? s[1] : '', body });
}

const LOCALES = ['hi', 'gu', 'mr'];
const stats = {};

for (const locale of LOCALES) {
  let filled = 0;
  let needs = 0;
  const outUnits = units.map((u) => {
    const t = T[u.id] && T[u.id][locale];
    if (t && t.length) {
      filled += 1;
      return `      <trans-unit id="${u.id}" datatype="html">\n        <source>${u.source}</source>\n        <target>${t}</target>\n      </trans-unit>`;
    }
    needs += 1;
    return `      <trans-unit id="${u.id}" datatype="html">\n        <source>${u.source}</source>\n        <target state="needs-translation">${u.source}</target>\n      </trans-unit>`;
  });
  const xliff =
`<?xml version="1.0" encoding="UTF-8" ?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
  <file source-language="en-IN" target-language="${locale}" datatype="plaintext" original="ng2.template">
    <body>
${outUnits.join('\n')}
    </body>
  </file>
</xliff>
`;
  fs.writeFileSync(path.join(localeDir, `messages.${locale}.xlf`), xliff, 'utf8');
  stats[locale] = { filled, needs, total: units.length };
}

console.log(JSON.stringify(stats, null, 2));
