/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-vars */
import onChange from 'on-change';

const renderErrors = (elements, state) => {
  const { errors } = state;
  const { form, urlInput } = elements;

  if (Object.keys(errors).length === 0) {
    urlInput.classList.remove('is-invalid');
    form.reset();
    urlInput.focus();
  } else {
    urlInput.classList.add('is-invalid');
  }
};

const watch = (elements, state) => {
  const watchedState = onChange(state, (path) => {
    switch (path) {
      case 'errors':
        console.log('errors!');
        renderErrors(elements, state);
        break;
      default:
        break;
    }
  });

  return watchedState;
};

export default watch;
