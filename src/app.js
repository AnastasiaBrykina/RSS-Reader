/* eslint-disable import/no-extraneous-dependencies */
import * as yup from 'yup';
import _ from 'lodash';
import watch from './view';

const validate = (fields, feeds) => {
  const schema = yup.object({
    url: yup.string().url().notOneOf(feeds),
  });
  return schema.validate(fields, { abortEarly: false });
};

const app = () => {
  const initialState = {
    form: {
      fields: {
        url: '',
      },
      isValid: true,
    },
    feeds: [],
    errors: null,
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    btn: document.querySelectorAll('#rss-btn'),
    urlInput: document.querySelector('#url-input'),
  };

  const watchedState = watch(elements, initialState);

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const dataForm = new FormData(event.target);
    const inputValue = dataForm.get('url').trim();
    watchedState.form.fields.url = inputValue;
    validate(watchedState.form.fields, watchedState.feeds)
      .then(() => {
        watchedState.errors = {};
        watchedState.feeds.push(inputValue);
        watchedState.form.isValid = true;
      })
      .catch((err) => {
        const validateErr = _.keyBy(err.inner, 'path');
        watchedState.errors = validateErr;
        watchedState.form.isValid = false;
      });

    console.log(initialState);
  });
};

export default app;
