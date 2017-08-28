
window.foo++;

var s = document.createElement('script');
s.src = '../test/specs/fixture/_ext2.js';
s.onload = window.TestHook;
document.getElementsByTagName('body')[0].appendChild(s);
