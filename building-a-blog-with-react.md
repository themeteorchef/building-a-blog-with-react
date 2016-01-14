<div class="note info">
  <h3>Pre-Written Code <i class="fa fa-info"></i></h3>
  <p><strong>Heads up</strong>: this recipe relies on some code that has been pre-written for you, <a href="https://github.com/themeteorchef/building-a-blog-with-react">available in the recipe's repository on GitHub</a>. During this recipe, our focus will only be on implementing a simple blog using React. If you find yourself asking "we didn't cover that, did we?", make sure to check the source on GitHub.</p>
</div>

<div class="note">
  <h3>Additional Packages <i class="fa fa-warning"></i></h3>
  <p>This recipe relies on several other packages that come as part of <a href="https://github.com/themeteorchef/base/tree/base-react">Base</a>, the boilerplate kit used here on The Meteor Chef. The packages listed below are merely recipe-specific additions to the packages that are included by default in the kit. Make sure to reference the <a href="https://github.com/themeteorchef/base/blob/base-react/.meteor/packages">Packages Included list</a> for Base to ensure you have fulfilled all of the dependencies.</p>
</div>

### Prep
- **Time**: ~2-3 hours
- **Difficulty**: Advanced
- **Additional knowledge required**: [basic usage of React](https://themeteorchef.com/recipes/getting-started-with-react/), [understanding props and state](https://themeteorchef.com/snippets/understanding-props-and-state-in-react) in React, and using [Flow Router](https://themeteorchef.com/snippets/using-flow-router-with-react/) with React.

### What are we building?
HD Buff is a curated video streaming service (like [MUBI.com](https://mubi.com)).  It's a really small service built by three enthusiastic film professionals that focuses on all the films you've never seen (as long as they're available in HD). They're looking to start a blog to keep up with their customers and asked us how to get it done. During our initial meetings, they mentioned that they'll want to extend its feature set in the long-run, but for now they just need a quick, simple way to write posts. 

In this recipe, we'll be helping the HD Buff crew to build a simple blog using Meteor and React. In terms of features, they said as long as someone can log in, write a post, and customers can sort those posts by tags later, they'll be happy. Oh, and they said Markdown is a _must-have_.

Before we get to work, here's a quick example of what we're after:

<figure>
  <img src="https://tmc-post-content.s3.amazonaws.com/hd-buff-demo.gif" alt="A simple blog for HD Buff.">
  <figcaption>A simple blog for HD Buff.</figcaption>
</figure>

Ready to get to work? Let's do it!

### Ingredients
Before we start building, make sure that you've installed the following packages and libraries in your application. We'll use these at different points in the recipe, so it's best to install these now so we have access to them later.

#### Meteor packages

<p class="block-header">Terminal</p>

```bash
meteor add ongoworks:speakingurl
```

We'll rely on the `ongoworks:speakingurl` package to help us generate URL friendly slugs based on our `post-titles-like-this`.

<p class="block-header">Terminal</p>

```bash
meteor add themeteorchef:commonmark
```
We'll use the `themeteorchef:commonmark` package to help us parse the [Markdown](https://daringfireball.net/projects/markdown/) posts will be written with on the client.

<p class="block-header">Terminal</p>

```bash
meteor add momentjs:moment
```
To help us parse dates on posts, we'll rely on the `momentjs:moment` package.

### Setting up an auth flow
To get us up and running, our first task will be to set up a basic authentication workflow. We want to organize our routes so that only members of the HD Buff team can get access to creating new posts and editing existing ones. To do this, we're going to rely on creating an `App` component in React that will determine when and where users should be routed.

We've already [set up some routes](https://github.com/themeteorchef/building-a-blog-with-react/tree/master/code/both/routes) (we've split these into two groups: `public` and `authenticated`), so let's focus on building out the `App` component each of the routes is using to render the view. If you're not familiar with this pattern, take a peek at [this snippet](https://themeteorchef.com/snippets/authentication-with-react-and-flow-router/) which will walk you through all of the finer details of what we'll cover below.

To get started, let's create our `App` component now.

<p class="block-header">/client/components/layout/app.jsx</p>

```javascript
App = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    return {
      loggingIn: Meteor.loggingIn(),
      hasUser: !!Meteor.user(),
      isPublic( route ) {
        return [
          'index',
          'singlePost',
          'tagIndex',
          'login',
          'recoverPassword',
          'resetPassword',
          'notFound'
        ].indexOf( route ) > -1;
      },
      canView() {
        return this.isPublic( FlowRouter.getRouteName() ) || !!Meteor.user();
      }
    };
  },
  getView() {
    return this.data.canView() ? this.props.yield : <Login />;
  },
  render() {
    return <div className="app-root">
      <AppHeader hasUser={ this.data.hasUser } />
      <div className="container">
        { this.data.loggingIn ? <Loading /> : this.getView() }
      </div>
    </div>;
  }
});
```

Lots of code! Don't panic. Let's focus down in the `render()` method of our component first. Here, we're working to determine _what_ the user should be able to see. As this `App` component is used for every route in the app, we can trust that it will always be the first "stopping point" for users. Because of this, here, we can implement the necessary functionality to decide whether or not they can see a certain page or not.

The part we want to pay attention to is `{ this.data.loggingIn ? <Loading /> : this.getView() }`. In this one line, we're asking the question "is the app currently logging in a user?" If someone _is_ being logged in, we want to display the [`<Loading />`](https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/client/components/global/loading.jsx) component for them (a simple SVG graphic that we [animate with CSS](https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/client/stylesheets/components/global/_loading.scss)). If not, we want to fire the `getView()` method we've defined up above in the component.

Up above, `getView()` is doing something similar to what we're doing in our `render()` method. At this point, we're asking _another_ question: "can this person view the page they're trying to access?" If the answer is yes, we reveal the page by returning `this.props.yield` (remember, from the current route, this is where we're telling `ReactLayout.render()` where to render the component being passed). If we went to `/login`, `this.props.yield` would equal the `<Login />` component. Make sense?

Conversely, if we get a negative response from `this.data.canView()`, we simply reveal the `<Login />` component in place of the requested route/component. Wait, what? This is a bit confusing at first. While you might expect us to want to perform a redirect to `/login` here, it's much easier to just reveal the `<Login />` component directly instead. Why? Well, consider that if we do this, the URL doesn't change in the browser's navigation bar. 

So, if we're trying to access a protected route like `/posts`, when the user logs in (using the form we've revealed via the `<Login />` component), they will automatically get the component intended for the `/posts` route. Let that sink in. The basic idea is that by using this pattern, we're removing the need to store _where_ the user was headed if we determine they need to login. Instead, we let the browser do the work and simply "open the gates" once we've authenticated the user. Pretty neat, eh?

#### Wiring up `canView()` and `isPublic()`

With all of this in mind, the next question is, "how are `this.data.canView()` and `this.data.isPublic()` working?" This is where everything in our `App` component comes together. In the `canView()` method, we're asking whether or not the current route name is considered "public" (meaning it's accessible to anyone), or, if a user is currently logged in (using `!!` to convert the result of `Meteor.user()`—an object—to a `Boolean`). If either of these return `true`, we return the requested view/component.

The magic of this happens inside of the `isPublic()` method. Notice that we're passing in the current route name via `FlowRouter.getRouteName()`. With this, we simply take the value and test it against an array of route names (pay attention, these are the `name` values defined on our routes, not the paths), seeing if the passed value exists in the array. If it _does_, this means that the route is public and okay to access. If it _doesn't_ exist, that means the route is protected and we should defer to `Meteor.user()` to see if a user is logged in. If they _are_, they see the protected route as expected. If not, they get the `<Login />` component like we outlined above!

With this in place, we now have a functioning auth flow for our app. This means that anyone from HD Buff can login and get access to the editor we'll build next, but the public is kept out. Nice!

<div class="note">
  <h3>Holy components, Batman! <i class="fa fa-warning"></i></h3>
  <p>We've taken a decidely shorter path to explaining the organization of our authentication flow. You may be wondering, "but what about that <code>&lt;AppHeader /></code> component?" Throughout this recipe, we may skip over <a href="https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/client/components/global/app-header.jsx">components like this</a>, so make sure to check the <a href="https://github.com/themeteorchef/building-a-blog-with-react">source on GitHub</a> if something isn't clear. <strong>If the concepts being used are not clear, make sure to defer to the links in the "Additional knowledge required" list</strong> in the Prep section of this post up top. These guides will help you to understand what's happening here.</p>
</div>

### Building the editor
Next up, we need to implement the editor where the HD Buff team will actually manage content on their blog. This will require three steps: adding the ability to list existing posts, the ability to create new posts, and the ability to edit posts in a form. Before we start our work on these components, though, we need to set up a collection where all of our data will live. To help us out later, we'll be using some Schema-foo to automate the creation of some of the data we'll need.

#### Setting up a collection and schema
Let's get our collection set up now. To start, let's get a simple definition in place and lock down our allow/deny rules (this will help us to keep the client secure and force all database operations to happen on the server).

<p class="block-header">/collections/posts</p>

```javascript
Posts = new Mongo.Collection( 'posts' );

Posts.allow({
  insert: () => false,
  update: () => false,
  remove: () => false
});

Posts.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
});
```

Simple enough! Here we create our new collection assigning it to the global variable `Posts` and then set up our `allow` and `deny` rules. Again, this is a security practice. Here, we're saying that we want to deny _all_ database operations on the client and we do not want to allow _any_ database operations on the client (specifically for our `Posts`) collection. This means that later, we'll need to use Meteor methods in order to manage our database. We do this because allow and deny rules are [finicky and error prone](https://www.discovermeteor.com/blog/allow-deny-challenge-results/). Using methods does add a little work to our plate, but gives us peace of mind for later.

Next up, we need to define a schema. For this, we're going to rely on the [aldeed:collection2](https://themeteorchef.com/snippets/using-the-collection2-package/) package that comes with [Base](https://github.com/themeteorchef/base/tree/base-react). Because some of the rules here are a little more complicated than others, let's add the basic ones first and then pepper in the more complicated stuff.

<p class="block-header">/collections/posts.js</p>

```javascript
let PostsSchema = new SimpleSchema({
  "published": {
    type: Boolean,
    label: "Is this post published?",
    autoValue() {
      if ( this.isInsert ) {
        return false;
      }
    }
  },
  "updated": {
    type: String,
    label: "The date this post was last updated on.",
    autoValue() {
      return ( new Date() ).toISOString();
    }
  },
  "title": {
    type: String,
    label: "The title of this post.",
    defaultValue: "Untitled Post"
  },
  "content": {
    type: String,
    label: "The content of this post.",
    optional: true
  },
  "tags": {
    type: [ String ],
    label: "The tags for this post.",
    optional: true
  }
});

Posts.attachSchema( PostsSchema );
```

Okay! Here, we have the basic parts of our schema. **This is not all of the fields we'll need**, just the ones with simple rulesets. Here, `published` is being used to determine whether or not the current post is published. This is a `Boolean` value, meaning it's either `true` (is published) or `false` (is not published). Notice that protect our authors, when we insert a new post we're automatically setting the value of this field to `false`. Neat, eh? This means that no matter what, if we insert a new post it will have its published value set to `false`. They'll thank us later!

Next, `updated` is doing something similar, however, setting the current date as an [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) string. A little further down, `title` and `content` are just going to be simple `String` values. For `tags`, this will just be validating as an `Array` of `String`s. Notice that both `content` and `tags` are being made optional. Why's that? Well, technically we'll be allowing our authors to create new posts _without_ any content or tags. While this isn't likely to happen all of the time, we may find authors wanting to save a post idea but not publish it yet (remember, posts are _not_ published by default). Finally, to save us some time, notice that we've already attached our schema to our `Posts` collection.

Now for the tricky part! Right now the HD Buff team isn't terribly concerned about content owernship. They've alluded to the idea that whoever last touched a post is going to be considered the owner. To make our lives easy, we can piggyback on `autoValue()` again, this time however, setting the author name automatically. Let's add it in:

<p class="block-header">/collections/posts.js</p>

```javascript
let PostsSchema = new SimpleSchema({
  "published": {
    type: Boolean,
    label: "Is this post published?",
    autoValue() {
      if ( this.isInsert ) {
        return false;
      }
    }
  },
  "author": {
    type: String,
    label: "The ID of the author of this post.",
    autoValue() {
      let user = Meteor.users.findOne( { _id: this.userId } );
      if ( user ) {
        return `${ user.profile.name.first } ${ user.profile.name.last }`;
      }
    }
  },
  [...]
});
```

Nothing _too_ crazy. Here, we're automatically setting the value of the `author` field on _any_ changes to posts (inserts, updates, etc.) with the name of the current user. To get their name, notice that we take `this.userId` (this is automatically provided by the collection2 package) and pass it to a call to `Meteor.users.findOne()`. From there, if we get a user back we grab the `first` and `last` name of the user from their `profile`'s `name` property and concatenate them into a String using ES2015's [template strings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/template_strings) feature. Phew! Now, if "Joe Buff" is logged in and creates a new post (or edits an existing one), he will be set as the author. If "Jane Buff" does the same, _she_ will be set as the author! Pretty slick.

Okay. Just one more of these to knock out and our schema is ready. This may be frustrating, but realize that we're saving ourselves a lot of effort later! Next, we need to account for duplicate `slug` values (`the-title-formatted-for-a-url-like-this`) for our posts automatically. Let's take a look:

<p class="block-header">/collections/posts.js</p>

```javascript
let PostsSchema = new SimpleSchema({
  [...]
  "title": {
    type: String,
    label: "The title of this post.",
    defaultValue: "Untitled Post"
  },
  "slug": {
    type: String,
    label: "The slug for this post.",
    autoValue() {
      let slug              = this.value,
          existingSlugCount = Posts.find( { _id: { $ne: this.docId }, slug: slug } ).count(),
          existingUntitled  = Posts.find( { slug: { $regex: /untitled-post/i } } ).count();

      if ( slug ) {
        return existingSlugCount > 0 ? `${ slug }-${ existingSlugCount + 1 }` : slug;
      } else {
        return existingUntitled > 0 ? `untitled-post-${ existingUntitled + 1 }` : 'untitled-post';
      }
    }
  },
  [...]
});
```

Don't give up! This is a bit trickier than our other `autoValue()`s but not too scary. Here, our goal is to determine whether or not a post with the same slug as the one currently being managed. This means that if we have a post called `my-great-film-review` and then try to add another with the same title, the slug will be set to `my-great-film-review-1`. This prevents overwriting and collisions in our URLs later and encourages authors to use more unique post titles.

To do this, we're creating two queries and counting the number of posts returned _by_ those queries. First, we check whether the current slug already exists in the database (we use a [JavaScript RegEx](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) to do this)—notice we filter out this post from the results to avoid renaming its slug with `{ $ne: this.docId }`—returning the number of existing posts with the same slug. Read that a few times! It's a bit of a brain buster. In essence, this returns us the number of posts that have the same `slug` value as the post being inserted or updated, excluding that post from the count (`$ne = "Does Not Equal"`).

Next, we do something very similar but this time for posts with the slug `untitled-post`. Wait, what? As we'll see in a little bit, whenever we create a new post we'll be giving it the title "Untitled Post" to start with. Here, we account for this and ensure that the slug value is handled properly. Down below, then, we check whether or not a slug is being passed. If one _is_ passed, we use our `existingSlugCount` suffixing the count plus one of matching posts to the returned value. If no posts exist, we return the value as-is.

If we _do not_ have a slug passed (meaning we're creating a new post and want this to be automated), we check our `existingUntitled` count and update the slug in the exact same way we handle existing slugs. Woah. This is a pretty powerful chunk of code, so read it over a few times! This will save us and the HD Buff team a lot of frustration later.

Phew. We're making good progress but we still have a lot to do. Let's keep chuggin'. Next up, we need to implement our ability to insert new posts and then display a list of those posts for editors to select from.

#### Creating and listing posts for editors
All right! Now we're getting in to the meat of this recipe. Now, we need a way to do two things: create a new post and list all of the posts in the system for the HD Buff team. To start, let's scope out the basic structure of our component along with its listing feature. Pay close attention as we'll be making reference to a few things that we won't cover directly but will link up to the code for.

<p class="block-header">/client/components/views/posts-list.jsx</p>

```javascript
PostsList = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    Meteor.subscribe( 'postsList' );

    return {
      posts: Posts.find().fetch().map( ( post ) => {
        return { uid: post._id, href: `/posts/${ post._id }/edit`, label: post.title };
      })
    };
  },
  renderPostsList() {
    if ( this.data.posts.length > 0 ) {
      return <ListGroup linked={ true } items={ this.data.posts } />;
    } else {
      return <WarningAlert>No posts found.</WarningAlert>;
    }
  },
  render() {
    return <GridRow>
      <GridColumn className="col-xs-12 col-sm-8 col-sm-offset-2">
        <SuccessButton type="button" label="New Post" onClick={ this.handleNewPost } />
        <PageHeader size="h4" label="Posts" />
        { this.renderPostsList() }
      </GridColumn>
    </GridRow>;
  }
});
```

A few things to noice. First, down in our `render()` method, in order to render our list of posts we're calling to a method `renderPostsList()` we've defined further up in our component. Our goal here is to conditionally display either a list of posts—if any exist—or, a message that reads "No posts found." Up in the `renderPostsList()` method, we can see this taking place. Inside, we begin by testing the length of `this.data.posts` (we'll cover this in detail soon). 

If it's greater than `0` (meaning posts were found), we go ahead and render the [`<ListGroup />`](https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/client/components/generic/list-group.jsx) component in [Base](https://github.com/themeteorchef/base/tree/base-react). Alternatively, if we _do not_ find any posts in the database, we display the [`<WarningAlert />`](https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/client/components/generic/alerts/warning-alert.jsx) component (a stylized variation of the [`<Alert />`](https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/client/components/generic/alerts/alert.jsx) component. Review that wiring a few times. All we're doing is rendering out the list of posts, or, display an alert message.

Let's review how the data is getting into the component to make sense of this. Up in the `getMeteorData()` method (this is the one that we get from Meteor's `react` package and is responsible for reactivity in the component), we begin to fetch data by subscribing to a publication called `postsList`. Real quick, let's see what that's returning.

<p class="block-header">/server/publications/posts-list.js</p>

```javascript
Meteor.publish( 'postsList', () => {
  return Posts.find();
});
```

Un-der-whel-ming! Pretty simple here. Because we're on the admin side of things, we simply want to return _all_ of the posts in the database. This means that all authors should have access to _all_ posts. Remember, ownership isn't a priority for HD Buff right now; they just want to get posts published without a lot of fuss. So far so good?

Back in our `<PostsList />` component, let's review how we're returning this data from `getMeteorData()`.

<p class="block-header">/client/components/views/posts-list.jsx</p>

```javascript
PostsList = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    Meteor.subscribe( 'postsList' );

    return {
      posts: Posts.find().fetch().map( ( post ) => {
        return { uid: post._id, href: `/posts/${ post._id }/edit`, label: post.title };
      })
    };
  },
  [...]
});
```

Here, we're returning a `posts` property (this will be accessible via `this.data.posts` elsewhere in the component) and assigning it to a query to find all of the posts returned from our publication. Next, we `fetch()` that list so we get it back as an `Array` (remember, by default we get a MongoDB cursor from `Posts.find()`) and then we `map()` over that array. Phew! Inside of our map, we give each of our returned posts a slightly different structure, including a `uid`, `href`, and `label` property. What gives?

What we're doing here is formatting the array of posts being returned from `this.data.posts` to match the API of our `<ListGroup />` component. It will be expecting `uid`, `href`, and `label` as props, so we take care of this here so the component can just handle the render. A little strange, so spend some time with the connection between this and the `<ListGroup />` we're outputting when we have posts.

Okay, moving right along. Now for something a little easier: creating new posts.

#### Creating new posts

This part is super simple. Let's look back at our `render()` method for our posts list. Notice that inside, we have a button with an `onClick` prop that's wired up to a method on our component called `handleNewPost()`. The idea here is that when we click this button, we'll fire this method which will call to the server for us. Real quick, here are the essentials:

<p class="block-header">/client/components/views/posts-list.jsx</p>

```javascript
PostsList = React.createClass({
  [...]
  handleNewPost() {
    Meteor.call( 'newPost', ( error, postId ) => {
      if ( error ) {
        Bert.alert( error.reason, 'danger' );
      } else {
        FlowRouter.go( `/posts/${ postId }/edit` );
        Bert.alert( 'All set! Get to typin\'', 'success' );
      }
    });
  },
  [...]
  render() {
    return <GridRow>
      <GridColumn className="col-xs-12 col-sm-8 col-sm-offset-2">
        <SuccessButton type="button" label="New Post" onClick={ this.handleNewPost } />
        <PageHeader size="h4" label="Posts" />
        { this.renderPostsList() }
      </GridColumn>
    </GridRow>;
  }
});
```

For creating a new post, we're not taking in any arguments from the user. Remember all of that "Untitled Post" beeswax from earlier? This is where it comes together. Let's take a peek at this `newPost` method we're dialing up on the server. 

<p class="block-header">/server/methods/insert/posts.js</p>

```javascript
Meteor.methods({
  newPost() {
    return Posts.insert( {} );
  }
});
```

Wait...hahahaha. Yep. That is seriously _it_. All of that work we did in our schema is paying off right here. How the heck is this working? Well, consider that for all of the fields in our schema, each either has:

1. A default value.
2. An automatically set value.
3. Is optional.

Combined, this means that when we insert a "blank" object into our collection, our schema is kicking in and automatically populating the required fields for us! Get outta here. Nope. Serious. Grab a pen and write home about this. You're officially a badass! Isn't this cool? Go ahead, beep your own horn.

If we look back at our component real quick, we can see that we're taking the returned post ID from our method (remember, when we call `.insert()` on a collection without a callback, Meteor returns the new document's `_id` value) and redirecting to the "editor" view for working on our post <code>FlowRouter.go( '/posts/${ postId }/edit' );</code>. This is our next stop! Now we need to wire up our editor to actually manage and publish posts.

#### Editing content
This is going to take _a lot_ of work. Don't let that spook you! In honesty, our `<Editor />` component looks scarier than it actually is because we're using up a lot of vertical space to list out props on our components. To step through everything efficiently, we're going to start by wiring up our data for our component _first_ and then discuss how we're making use of it. There's a lot of repetition in concepts here, so pay close attention to the first few to make sure you have a solid grasp on what we're doing.

<p class="block-header">/client/components/views/editor.jsx</p>

```javascript
Editor = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    Meteor.subscribe( 'editor', this.props.post );

    return {
      post: Posts.findOne( { _id: this.props.post } )
    };
  },
  [...]
  render() {
    if ( !this.data.post ) { return <div />; }

    return [...]
  }
});
```

Easy does it to start! Notice that in terms of loading in data, this is all pretty simplistic. First, up in `getMeteorData()`, notice that we're pulling in the value `this.props.post` in order to subscribe to our data and filter down _which_ post we're currently editing. But wait, where is that coming from? Our route! Let's take a quick peek to see how it's being passed down.

<p class="block-header">/both/routes/authenticated.jsx</p>

```javascript
[...]

authenticatedRoutes.route( '/posts/:_id/edit', {
  name: 'editor',
  action( params ) {
    ReactLayout.render( App, { yield: <Editor post={ params._id } /> } );
  }
});
```

In our [authenticated routes group](https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/both/routes/authenticated.jsx), we're defining our path (the one we redirected to in the previous step after creating a post and linked each of our list items to) to our editor. Notice that in the `action()` method, we're pulling in the `params` object for the route and on our invocation of `<Editor />`, we're passing `post={ params._id }`, or, the `_id` value from our URL! By passing this into our props, whenever our URL changes to a new post, our component will automatically get access to its `_id` straight from the router. Swish.

Back in our `<Editor />`, then, we subscribe to our `editor` publication passing in the post ID and then—to compensate for React's speed when moving between views—pass the ID to our `Posts.findOne()` as well. This ensures that when we go to a different post, we don't get stuck on the previous one because that's what our component sees in the minimongo collection (the result we'd get if we left this as a plain `Posts.findOne()`). Safety first!

Speaking of safety, we also need to account for our data not being ready down in our `render()` method. Notice that we first check to see if `this.data.post` is defined and if it's _not_, we return an empty div until it _is_ ready. Once it _is_ ready, we return our component's actual markup (we'll do this next). So far so good? Okay, **strap on your goggles, we're going downhill at full speed from here**!

<p class="block-header">/client/components/views/editor.jsx</p>

```javascript
Editor = React.createClass({
  [...]
  generateSlug( event ) {
    let { setValue } = ReactHelpers,
        form         = this.refs.editPostForm.refs.form,
        title        = event.target.value;

    setValue( form, '[name="postSlug"]', getSlug( title, { custom: { "'": "" } } ) );
  },
  getLastUpdate() {
    if ( this.data ) {
      let { formatLastUpdate } = ReactHelpers,
          post                 = this.data.post;

      return `${ formatLastUpdate( post.updated ) } by ${ post.author }`;
    }
  },
  getTags() {
    let post = this.data.post;

    if ( post && post.tags ) {
      return post.tags.join( ', ' );
    }
  },
  handleSubmit( event ) {
    event.preventDefault();
  },
  render() {
    if ( !this.data.post ) { return <div />; }

    return <GridRow>
      <GridColumn className="col-xs-12 col-sm-8 col-sm-offset-2">
        <PageHeader size="h4" label="Edit Post" />
        <Form ref="editPostForm" id="edit-post" className="edit-post" validations={ this.validations() } onSubmit={ this.handleSubmit }>
          <p className="updated-date">
            <strong>Last Updated:</strong> { this.getLastUpdate() }
          </p>
          <FormGroup>
            <FormControl
              style="checkbox"
              name="postPublished"
              id="#post-published"
              label="Published?"
              defaultValue={ this.data.post && this.data.post.published }
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              showLabel={ false }
              style="input"
              type="text"
              name="postTitle"
              label="Title"
              onChange={ this.generateSlug }
              defaultValue={ this.data.post && this.data.post.title }
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              disabled={ true }
              showLabel={ false }
              style="input"
              type="text"
              name="postSlug"
              label="Slug"
              defaultValue={ this.data.post && this.data.post.slug }
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              showLabel={ false }
              style="textarea"
              name="postContent"
              label="Content"
              defaultValue={ this.data.post && this.data.post.content }
            />
          </FormGroup>
          <FormGroup>
            <FormControl
              showLabel={ false }
              style="input"
              type="text"
              name="postTags"
              label="Tags"
              defaultValue={ this.getTags() }
            />
          </FormGroup>
          <FormGroup>
            <SuccessButton type="submit" label="Save Post" />
          </FormGroup>
        </Form>
      </GridColumn>
    </GridRow>;
  }
});
```

Seriously?! I warned you! We've got a lot going on here so let's work our way through it. First, the basics. Down in our `render()` method, let's inspect each of the [`<FormControl />`](https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/client/components/generic/forms/form-control.jsx) components being added. The part we want to pay attention to on each, here, is the `defaultValue` property. Notice that for the first four fields we're rendering, we're setting this equal to `this.data.post && this.data.post.<someProperty>`. What gives?

This is a trick picked up from reader [Patrick Lewis](https://twitter.com/patrickml1). While we may expect this to return a `Boolean` value, in JSX, the interpretation is to say if both of these return `true` (exist), then _return_ the last value in the chain. This helps us to avoid a bunch of ternary operators littering our code. It's a bit cryptic the first time you see it, but once you start to use it you won't want to go back! 

What this all translates to, then, is that we're setting the default value for each of our input fields _if_ a value exists for that field on `this.data.post`. This covers two scenarios: editing a new post we just created with _some data_ and coming back later to edit a post with everything. If you've been having trouble wrapping your head around the importance of components and React, this is it: extreme frugality in respect to reusing interface components! This is like [extreme couponing](https://www.youtube.com/watch?v=8lFWTGog__I) for developers.

For our final input—where we'll render a list of tags—we make a call to a method up above `this.getTags()`. It's pretty simple but important, so let's take a closer look.

<p class="block-header">/client/components/views/editor.jsx</p>

```javascript
getTags() {
  let post = this.data.post;

  if ( post && post.tags ) {
    return post.tags.join( ', ' );
  }
}
```

Because our list of tags will be stored as an _array_, when returning it back to the editor, we need to "prettify it" as a string. For example, we're expecting something like this `[ 'tacos', 'burritos', 'sandwiches' ]` but want to set the value of our tags input to `tacos, burritos, sandwiches`. Using this method `getTags()`, we accomplish this by pulling in the post data and if we discoer it has tags set, use a JavaScript `.join( ', ' )` to return our array as a comma-separated string! 

<div class="note">
  <h3>Why not use a component? <i class="fa fa-warning"></i></h3>
  <p>As of writing, adding third-party components is tricky. The original scope for this recipe was to include a token input, however, the experience of implementing it was confusing to say the least. Unless you're comfortable getting your hands dirty, usage of third-party components is unadvised until Meteor adds proper support for <code>require</code> in Meteor 1.3.</p>
</div>

Continuing down a similar path, let's slide up our component a little further and look at the `getLastUpdate()` method we're using toward the top of our component's `render()` method.

<p class="block-header">/client/components/views/editor.jsx</p>

```javascript
getLastUpdate() {
  if ( this.data ) {
    let { formatLastUpdate } = ReactHelpers,
        post                 = this.data.post;

    return `${ formatLastUpdate( post.updated ) } by ${ post.author }`;
  }
}
```

A little more involved, but about the same. Here, we check if our data is available and if it is, we assign a few variables. The first is a bit funky. Here, we're using ES2015 object destructuring to say "give us the `formatLastUpdate()` method that's defined in the global `ReactHelpers` object." What's that? This is a collection of helpers that is being [added to the React port of Base](https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/client/helpers/react.js) (the TMC starter kit).

Here, `formatLastUpdate()` is responsible for taking the date our post was last marked as updated—remember, we set this in our schema to be an ISO8601 string—and returning it as a human readable string like `January 13th, 2016 10:30 am` (behind the scenes we're using the `momentjs:moment` packag we installed earlier). To close the loop here, we concatenate this result with the word `by` and the value of `post.author`, which, again, is the name of the most recent user to update this post (set by `autoValue()` in our schema). Pretty wild stuff!

Okay. Next up is something really neat! To make the editing experience nice and simple for the folks at HD Buff, we want to auto-generate slugs based on whatever title they set on the post. To do this, notice that in our `render()` method, the `<FormControl />` component for our post's title has an `onChange={ this.generateSlug }` prop. Can you guess what's happening here? Whenever this input changes (meaning a user types in it), we want to grab that value, convert it into a slug `like-this-right-here` and set it on the slug field beneath the title. Let's take a peek at the `generateSlug()` method we're calling.

<p class="block-header">/client/components/views/editor.jsx</p>

```javascript
generateSlug( event ) {
  let { setValue } = ReactHelpers,
      form         = this.refs.editPostForm.refs.form,
      title        = event.target.value;

  setValue( form, '[name="postSlug"]', getSlug( title, { custom: { "'": "" } } ) );
}
```

We're building up a lot of knowledge here! Notice that again, we're pulling in one of the methods `setValue` from our `ReactHelpers` global (this will help us set the slug we generate on the slug input). Next, we do something funky involving React's refs. Due to the shape of our [`<Form />`](https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/client/components/generic/forms/form.jsx) component, we need to get access to that form by calling `this.refs.editPostForm.refs.form`. If you look down in our `render()` method, you'll notice `<Form />` has a prop `ref="editPostForm"` on it. This is React's way of identifying a DOM node within a component. By calling `this.refs.editPostForm.refs.form`, we're essentially grabbing the _nested_ ref of the `<Form />` component to access the actual DOM node for the form. _Gasp_. That was long-winded. If that's confusing, take a peek at the wiring of the `<Form />` component [here](https://github.com/themeteorchef/building-a-blog-with-react/blob/master/code/client/components/generic/forms/form.jsx).

Next, we grab the value of `event.target`, or, our title input. This works because the "event" that's taking place is happening on our title input. By proxy, then, `event.target` is equal to our title input. With _all of this_ bundled up, we make a call to `setValue()`, passing the context for where our field will be—`form`—the name attribute of the element we want to set the value on—our slug input—and finally, we use the `getSlug()` method from the `ongoworks:speakingurl` package we installed earlier to generate the `slugified-version-of-our-title`. 

Yikes! That seems like a lot, but step through it and it will make sense. With this in place, whenever we edit the value of our title input, our slug will automatically be generated and set on the slug input! Nice work. That was a big one to solve.

Last but not least for this form, let's get some validation wired up and then handle saving changes on the server!

#### Saving the form
Here comes the turkey. This is a big step, but should actually look somewhat familiar if you've worked with validation in the past. What we want to do now is validate the fields in our editor and if they're good to go, push an update of our post to the server. If you're new to validation, take a peek at this post on [jQuery validation](https://themeteorchef.com/snippets/validating-forms-with-jquery-validation/), the underying package we'll use to validate our form here.

<p class="block-header">/client/components/views/editor.jsx</p>

```javascript
validations() {
  let component = this;

  return {
    rules: {
      postTitle: {
        required: true
      }
    },
    messages: {
      postTitle: {
        required: "Hang on there, a post title is required!"
      }
    },
    submitHandler() {
      let { getValue, isChecked } = ReactHelpers;

      let form = component.refs.editPostForm.refs.form,
          post = {
            _id: component.props.post,
            title: getValue( form, '[name="postTitle"]' ),
            slug: getValue( form, '[name="postSlug"]' ),
            content: getValue( form, '[name="postContent"]' ),
            published: isChecked( form, '[name="postPublished"]' ),
            tags: getValue( form, '[name="postTags"]' ).split( ',' ).map( ( string ) => {
                return string.trim();
              })
          };

      Meteor.call( 'savePost', post, ( error, response ) => {
        if ( error ) {
          Bert.alert( error.reason, 'danger' );
        } else {
          Bert.alert( 'Post saved!', 'success' );
        }
      });
    }
  };
},
handleSubmit( event ) {
  event.preventDefault();
}
```
Woah buddy! A lot going on here but nothing too crazy. Notice that we have two methods output here: `validations()` and `handleSubmit()`. Here, `handleSubmit()` is responsible for "terminating" the default behavior of our form's `onSubmit` method—we can see this being attached to our `<Form />` component in our `render()`—and instead, deferring submission to our validation's `submitHandler()` method. This is a bit strange, but allows us to get our form validated and handle the submission without a lot of running around.

Inside `validations()`—this is also attached to our `<Form />` component as a prop—we add a single rule for our `postTitle` input. This is ensuring that `postTitle` is _not_ blank when our user submits the form. If it is, they'll be asked to correct it before they submit the form. Once the form is all green, we get to work in our `submitHandler()`. At this point, we're building up the object we'll send to the server to update our post.

Here, we're making use of a few more helpers from our `ReactHelpers` object. At this point, all we're doing is fetching the current values from each of the fields in our form. Two to point out: `published` and `tags`. Notice that for published, we're using the helper `isChecked` to determine whether or not the "Published?" box is checked. For `tags`, we're grabbing the current value of the input and then _splitting_ it into an array. To make sure our data is clean, we use a map to return an array of with each value obtained from the string with a `trim()`. This ensures that none of our tags have any trailing spaces (e.g. <code>tag </code> vs. `tag`).

So far so good? Once we have this, it's up to the server to save the post!

#### Updating the post on the server

Let's take a look at our `savePost` method on the server. Hint: it's really simple.

<p class="block-header">/server/methods/update/posts.js</p>

```javascript
Meteor.methods({
  savePost( post ) {
    check( post, Object );

    let postId = post._id;
    delete post._id;

    Posts.upsert( postId, { $set: post } );
  }
});
```

Yep, pretty simple! Here, we're not doing much. First, we [check](https://themeteorchef.com/snippets/using-the-check-package/) that the value we get from the client is an `Object`. Next, we assign the value of `post._id` to a variable `postId` and then delete it from the main `post` object (we don't want to include this in the value we pass to our `upsert` below). Finally, we perform an `upsert` on our `Posts` collection, passing in our post's contents via a MongoDB `$set` method. Why use an `upsert` here? 

Well, remember that when creating our new posts, we didn't set a content or tags field. With an upsert, we get the best of doing an update and an insert. If a field doesn't exist on the object we're trying to update, the upsert will create it for us. If it already exists, it will just update the value! This means that we don't have to fight with missing fields conflicting with those that already exist. We just call an `upsert` and let Mongo handle the stick parts for us. 

Awesome. At this point, we've got our posts inserting and everything wired up for admins. Next, let's focus on getting posts output for our readers. This will be much simpler and should go pretty fast!

### Listing posts in the index (and tag pages)
Great work so far. We've come a long way, but we're not quite done. Next, we need to wire up a list of posts for HD Buff's readers. This will be the main stream of _published_ posts. In tandem with this, we're also going to wire up a way to make this list filterable by tag. Let's dive in. Our `<PostsIndex />` component is pretty simple compared to what we've accomplished so far, so let's take a quick tour of how everything is working here (a lot of repeated concepts).

<p class="block-header">/client/components/views/posts-index.jsx</p>

```javascript
PostsIndex = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    let query = {};

    if ( this.props.tag ) {
      Meteor.subscribe( 'tagsIndex', this.props.tag );
      query = { tags: { $in: [ this.props.tag ] } };
    } else {
      Meteor.subscribe( 'postsIndex' );
    }

    return {
      posts: Posts.find( query, { sort: { updated: -1 } } ).fetch()
    };
  },
  renderHeader() {
    if ( this.props.tag ) {
      return <Jumbotron className="tags-header">
        <h4>Posts tagged with: { this.props.tag }.</h4>
      </Jumbotron>;
    } else {
      return <Jumbotron className="blog-header">
        <h2>Get Buff</h2>
        <h4>A new blog by the HD Buff crew.</h4>
      </Jumbotron>;
    }
  },
  renderPosts() {
    if ( this.data.posts.length > 0 ) {
      return this.data.posts.map( ( post ) => {
        return <Post key={ post._id } post={ post } />;
      });
    } else {
      return <WarningAlert>No posts found.</WarningAlert>;
    }
  },
  render() {
    return <div className="posts">
      <GridRow>
        <GridColumn className="col-xs-12 col-sm-8 col-sm-offset-2">
          { this.renderHeader() }
          { this.renderPosts() }
        </GridColumn>
      </GridRow>
    </div>;
  }
});
```

This should look super familiar. At this point, we're starting to repeat a lot of the patterns we've introduced so far. Let's do a quick breeze through this component, explaining the important pieces. Sound good?

First, let's call attention to how we're pulling data. Remember, our goal for this component is to pull in data in one of two ways: either filtered by tag, or, with no filter (all published posts on the site). To achieve this, up in our call to `getMeteorData()`, we're doing a little `if`-foo to determine whether or not we're trying to render a list of posts by tag. If we detect the prop `this.props.tag`, we assume that yes, we want to filter by tag.

In this case, we take the tag and pass it to our publication `tagsIndex` (we'll look at this soon) and then set `query` (the value we'll pass to the query set to the `posts` value of our object returned from `getMeteorData()`) to only gives us back the posts where the current tag is in the `tags` array of the post. Said another way, if we return a list of posts from the server like this:

```javascript
{ _id: '1', tags: [ 'peanuts', 'butter', 'oil' ] }
{ _id: '2', tags: [ 'tacos', 'almonds', 'cookies' ] }
{ _id: '3', tags: [ 'peanuts', 'sandwiches', 'political-differences' ] }
```

if we pass the tag `peanuts`, we'd only expect to get back posts `1` and `3` (those are the only posts with `peanuts` in their `tags` array). Making sense?

A little less complex, if we _do not_ detect `this.props.tag`, we simply want to subscribe to `postsIndex`. Let's take a look at those two side-by-side now.

<p class="block-header">/server/publications/posts-index.js</p>

```javascript
Meteor.publish( 'postsIndex', function() {
  return Posts.find( { published: true } );
});

Meteor.publish( 'tagsIndex', function( tag ) {
  check( tag, String );
  return Posts.find( { published: true, tags: { $in: [ tag ] } } );
});
```

About what we'd expect. Notice for `postsIndex` we simply return _all_ of the posts who's `published` flag is set to `true`. Down in `tagsIndex`, we do something similar, however, also passing in the `tag` from the client using an identical `{ $in: [ tag ] }` check like we did on the client. This guarantees that we only get back posts with the matching tag. Neat!

Back in our `<PostsIndex />` component, the rest is pretty simple. If we're on a tag page we decide to render a slightly different page header displaying the name of the currently selected tag. For `renderPosts()`, if we have a set of posts we want to map over those returning an instance of `<Post />` (we'll look at this next). Otherwise, we return a "No posts found." message just like we did for editors earlier. Boom! Making progress. 

Real quick, let's take a peek at that `<Post />` component as it's got a little more going on then meets the eye.

#### The `<Post />` component

The `<Post />` component is reusing a lot of the same techniques as explained above, except for one. Let's take a look at the full component and then talk about the one that stands out.

<p class="block-header">/client/components/generic/post.jsx</p>

```javascript
Post = React.createClass({
  getPostTitle() {
    let post = this.props.post;
    
    if ( this.props.singlePost ) {
      return <h3>{ post.title }</h3>;
    } else {
      return <h3><a href={ `/posts/${ post.slug }`}>{ post.title }</a></h3>;
    }
  },
  getHTML( markdown ) {
    if ( markdown ) {
      return { __html: parseMarkdown( markdown ) };
    }
  },
  renderTags( tags ) {
    if ( tags ) {
      return <div className="tags">
        {tags.map( ( tag ) => {
          return <a className="tag" href={ `/tags/${ tag }` }>#{ tag }</a>;
        })}
      </div>;
    }
  },
  render() {
    let { formatLastUpdate } = ReactHelpers,
        post                 = this.props.post;

    return <div className="post">
      { this.getPostTitle() }
      <p><strong>Last Updated:</strong> { formatLastUpdate( post.updated ) } by { post.author }</p>
      { this.renderTags( post.tags ) }
      <div className="post-body" dangerouslySetInnerHTML={ this.getHTML( post.content ) } />
    </div>;
  }
});
```

Okay! A lot of this is pretty straightforward. Here, we're rendering the actual contents of a post out for display. Notice that down in our `render()` method, we're simply grabbing the contents of our post and then displaying them in the UI. Because we'll be using this component conditionally (in either a list of posts or as a single post), we've set up a few methods to help us negotiate that process. For `getPostTitle()`, notice that we're checking whether or not our component has a `this.props.singlePost` value. 

In our last step, we'll wire up a component that makes use of this. If we _do_ detect this value, we want to return a plain `<h3></h3>` tag containing our title _without_ a link. If we're not on a single post, we return an `<h3></h3>` tag with a link _to_ our post. Think about that one! If we're in a list of posts, we'll want a link so we can read the post. If we're on a single post, we're already viewing it so we don't need the link. 

For our tags, there's not much mystery. Inside of `renderTags()`, if we get a list of tags for our post, we simply map over each and return an `<a></a>` tag with a link to that tag's page (this makes use of the code we wrote in the previous step) along with the name of the tag. Simple! 

The big scary part (not really) of this is Markdown. In React, it's advised to be cautious when setting HTML directly on a component. Most of the time this isn't necessary, however, with Markdown conversion, we _will_ need to set HTML directly. Why? Well, when we get our post back here on the client, what we're actually getting back is a string of Markdown. In order to convert that into HTML, we need a way to do that and then set the value in our component.

Here, if we look at `<div className="post-body"></div>` we can see this taking place in the prop `dangerouslySetInnerHTML`. Spooky! This method is aptly named as outside of scenarios like this, setting this value can leave a component vulnerable to [XSS](https://facebook.github.io/react/tips/dangerously-set-inner-html.html) attacks. Fortunately in this case, we're safe as we know what we're putting into the DOM (at that location) has been properly sanitized. To handle that sanitization, notice that we're making a call to `this.getHTML()`.

If we look at that method, it's pretty simple. All we're doing here is returning an object with a property `__html`, equal to the result of converting our Markdown into HTML. We get the `parseMarkdown()` method from the `themeteorchef:commonmark` package we installed earlier. In passing our string of Markdown to it, we get back a sanitized, HTML-ified version of our posts contents. We set this on the `__html` propery of the object we're returning and React takes care of the rest! Note: that `__html` property in an object thing is specific to `dangerouslySetInnerHTML`. If we pass our string directly, React will throw a tantrum.

That's all we need to know for our `<Post />` component! One last step: rendering a single post. This is quick and painless, so let's take a look.

### Displaying a single post
Fortunately, with our `<Post />` component wired up, displaying a single post is pretty easy. Let's dump out the whole component and explain what's happening.

<p class="block-header">/client/components/views/single-post.jsx</p>

```javascript
SinglePost = React.createClass({
  mixins: [ ReactMeteorData ],
  getMeteorData() {
    let sub = Meteor.subscribe( 'singlePost', this.props.slug );

    return {
      post: Posts.findOne( { slug: this.props.slug } ),
      ready: sub.ready()
    };
  },
  render() {
    if ( !this.data ) { return <div />; }
    return <GridRow>
      <GridColumn className="col-xs-12 col-sm-8 col-sm-offset-2">
        <Post singlePost={ true } post={ this.data.ready && this.data && this.data.post } />
      </GridColumn>
    </GridRow>;
  }
});
```

Pretty close to what we've been up to. Notice that down in our `render()` method, we're wiring up our data source to the `<Post />` component we just wrapped up. That's the bulk of this component! The one thing we want to call attention to is how we're loading in our data. Notice that up in `getMeteorData()`, we're assigning our subscription to `sub`, and then making the response to its `.ready()` handle available at `this.data.ready`. We make use of `this.data.ready` down below in our call to `<Post />`. 

What's up with this? This is a safeguard. What we want to avoid is React moving too fast and rendering with the wrong data. By tying into `sub.ready()`, we're waiting to return data to our `<Post />` component until we're absolutely certain we have the post data we need. We can do this because our call to `Meteor.subscribe( 'singlePost' );` is updating when we change posts (e.g. clicking on another post in our list). Let's take a peek at our publication real quick to understand that.

<p class="block-header">/server/publications/single-post.js</p>

```javascript
Meteor.publish( 'singlePost', ( postSlug ) => {
  check( postSlug, String );

  return Posts.find( { slug: postSlug } );
});
```

Making sense? When we move to a new post, we grab its slug value from our route and pass it into `<SinglePost slug={ params.slug } />` as a prop. Then, in the component we subscribe using that same slug, returning only the post that matches that slug in the database. Nice and tidy!

Back in our component, then, whenever we make the change to a new post, we're updating the slug and our subscription re-responds to `sub.ready()`. Neat! This means that we avoid any issues with displaying the incorrect post, allowing React's speed to play nicely with Meteor's reactivity. 

That's it! At this point, we've successfully fulfilled HD Buff's request for a simple blog! We have the ability to post, view a list of posts, sort posts by tag, and view a single post. We even added a means for managing posts behind the scenes for HD Buff's team. Great work!

### Wrap up & summary
In this recipe we learned how to create a simple blog using Meteor and the React user interface library. We learned how to wire up a large collection of components, working with things like nesting, passing around props, and wiring up a data source with `ReactMeteorData`. Further, we learned how to manage an editing interface for writing posts as well as how to get those posts to display back for users. We even learned how to make use of collection2's `autoValue()` method to do some heavy lifting for us!