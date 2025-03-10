class CssPropControl {
  constructor(element) {
    this.element = element;
  }
  get(varName) {
    return getComputedStyle(this.element).getPropertyValue(varName);
  }
  set(varName, val) {
    return this.element.style.setProperty(varName, val);
  }
}

const bodyCssProps = new CssPropControl(document.body);

let toggle = document.querySelector('#dark-mode-toggle');
toggle.addEventListener('click', () => { 
  let mode = toggle.checked ? 'dark' : 'light';
  bodyCssProps.set('--background', bodyCssProps.get(`--${mode}-background`));
  bodyCssProps.set('--primary', bodyCssProps.get(`--${mode}-primary`));
  bodyCssProps.set('--link', bodyCssProps.get(`--${mode}-link`));
});

var $loader = document.querySelector('.loader');

// Remove the loader class on page load
window.onload = function() {
  $loader.classList.remove('loader--active');
};

// Add event listeners to the navigation links
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', function (event) {
    event.preventDefault();
    $loader.classList.add('loader--active');
    window.setTimeout(function () {
      window.location.href = link.href;
    }, 1400); // Matches the CSS transition duration
  });
});