import { uniqueId } from 'lodash';

const rssParser = (content) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'application/xml');
  return doc;
};

const getFeed = (rssDom, url) => {
  const channel = rssDom.querySelector('channel');
  const titleFedd = channel.querySelector('title');
  const descriptionFeed = channel.querySelector('description');

  const initialFeed = {
    id: uniqueId(),
    title: titleFedd.textContent,
    description: descriptionFeed.textContent,
    link: url,
  };

  return initialFeed;
};

const getPosts = (rssDom, feedId) => {
  const channel = rssDom.querySelector('channel');
  const posts = channel.querySelectorAll('item');

  const mappedPosts = Array.from(posts).map((post) => {
    const titlePost = post.querySelector('title');
    const linkPost = post.querySelector('link');
    const descriptionPost = post.querySelector('description');

    const initialPost = {
      feedId,
      title: titlePost.textContent,
      description: descriptionPost.textContent,
      link: linkPost.textContent,
    };

    return initialPost;
  });

  return mappedPosts;
};

export { rssParser, getFeed, getPosts };
