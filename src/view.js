/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-vars */
import onChange from 'on-change';

const makePostsList = (posts, i18n) => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  posts.forEach((post) => {
    const { title, link, id } = post;
    const li = document.createElement('li');
    li.classList.add(
      'list-group-item',
      'd-flex',
      'justify-content-between',
      'align-items-start',
      'border-0',
      'border-end-0',
    );
    ul.append(li);

    const a = document.createElement('a');
    a.classList.add('fw-bold');
    a.setAttribute('href', link);
    a.setAttribute('data-id', id);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
    a.textContent = title;
    li.append(a);

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('type', 'button');
    button.setAttribute('data-id', title);
    // button.setAttribute('data-bs-toggle', 'modal');
    // button.setAttribute('data-bs-target', '#modal');
    i18n.then((t) => {
      button.textContent = t('posts.button');
    });
    li.append(button);
  });

  return ul;
};

const makeFeedsList = (feeds) => {
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  feeds.forEach((feed) => {
    const { title, description } = feed;
    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    ul.prepend(li);

    const h3 = document.createElement('h3');
    h3.classList.add('h6', 'm-0');
    h3.textContent = title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = description;

    li.append(h3, p);
  });

  return ul;
};

const makeCardBody = (i18n, type) => {
  const card = document.createElement('div');
  card.classList.add('card', 'border-0');

  const cardBody = document.createElement('div');
  cardBody.classList.add('card-body');
  card.append(cardBody);

  const cardTitle = document.createElement('h2');
  cardTitle.classList.add('card-title', 'h4');
  i18n.then((t) => {
    cardTitle.textContent = t(`${type}.title`);
  });
  cardBody.append(cardTitle);

  return card;
};

const renderPosts = (elements, state, i18n) => {
  const { postsContainer } = elements;
  const { posts } = state;

  postsContainer.innerHTML = '';

  const divPosts = makeCardBody(i18n, 'posts');
  postsContainer.append(divPosts);

  const postsList = makePostsList(posts, i18n);
  divPosts.append(postsList);
};

const renderFeeds = (elements, state, i18n) => {
  const { feedsContainer } = elements;
  const { feeds } = state;

  feedsContainer.innerHTML = '';

  const divFeeds = makeCardBody(i18n, 'feeds');
  feedsContainer.append(divFeeds);

  const feedsList = makeFeedsList(feeds);
  divFeeds.append(feedsList);
};

const renderErrors = (elements, state, i18n) => {
  const { errKey } = state;
  const { urlInput, feedback } = elements;

  if (!errKey) {
    urlInput.classList.remove('is-invalid');
    i18n.then((t) => {
      feedback.classList.remove('text-danger');
      feedback.classList.add('text-success');
      feedback.textContent = t('errors.validation.valid');
    });
  } else {
    urlInput.classList.add('is-invalid');
    i18n.then((t) => {
      feedback.classList.remove('text-success');
      feedback.classList.add('text-danger');
      feedback.textContent = t(errKey);
    });
  }
};

const handleProcessState = (elements, processState) => {
  const { form, btn, urlInput } = elements;
  switch (processState) {
    case 'sending':
      btn.setAttribute('disabled', '');
      urlInput.setAttribute('disabled', '');
      break;
    case 'failed':
      btn.removeAttribute('disabled');
      urlInput.removeAttribute('disabled');
      break;
    case 'finished':
      btn.removeAttribute('disabled');
      urlInput.removeAttribute('disabled');
      form.reset();
      urlInput.focus();
      break;
    default:
      break;
  }
};

const watch = (elements, state, i18n) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'errKey':
        console.log('errors!');
        renderErrors(elements, state, i18n);
        break;
      case 'feeds':
        console.log('feeds!');
        renderFeeds(elements, state, i18n);
        break;
      case 'posts':
        console.log('posts!');
        renderPosts(elements, state, i18n);
        break;
      case 'form.processState':
        console.log('state!');
        handleProcessState(elements, value);
        break;
      default:
        break;
    }
  });

  return watchedState;
};

export default watch;
