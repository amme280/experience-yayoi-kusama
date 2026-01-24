(function(){
  document.addEventListener('DOMContentLoaded', () => {
    const img = document.querySelector('.casque');
    const pageFade = document.querySelector('.page-fade');
    if(!img) return;

    const suspenseMs = 100;
    const dissolveMs = 600;
    const holdMs = 2500;
    const nextDelayMs = 100;
    const pageDissolveMs = 200;

    // start hidden, then dissolve in
    setTimeout(() => {
      img.classList.add('is-visible');
    }, suspenseMs);

    // hold, then dissolve out
    setTimeout(() => {
      img.classList.remove('is-visible');
    }, suspenseMs + dissolveMs + holdMs);

    // when image is  back to 0% opacity, wait 100ms then dissolve to white and navigate
    const goNextAtMs = suspenseMs + dissolveMs + holdMs + dissolveMs + nextDelayMs;
    setTimeout(() => {
      if(!pageFade){
        window.location.href = 'chap1-video.html';
        return;
      }
      pageFade.classList.add('is-active');
      setTimeout(() => {
        window.location.href = 'chap1-video.html';
      }, pageDissolveMs);
    }, goNextAtMs);
  });
})();
