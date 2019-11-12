document.addEventListener('DOMContentLoaded', () => {

  for (let btn of document.getElementsByClassName('submit-animation')) {
    btn.addEventListener('click', e => {
      const val = "progressText" in btn.dataset ? btn.dataset.progressText : btn.value;
      anim(btn, val);
    });
  }

});

function anim(button, text, iter = 0) {
  button.value = text + '.'.repeat(iter);

  setTimeout(() => {
    anim(button, text, (iter + 1) % 4);
  }, 0.5 * 1000);
}