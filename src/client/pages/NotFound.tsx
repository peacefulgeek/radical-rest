import React from 'react';

export default function NotFound() {
  return (
    <article className="rr-article">
      <h1>Not here.</h1>
      <p>That page does not exist. Or it moved. Or you mistyped a slug.</p>
      <p>
        <a href="/">Go back to the homepage</a> and pick something to read.
      </p>
    </article>
  );
}
