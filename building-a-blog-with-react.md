<div class="note info">
  <h3>Pre-Written Code <i class="fa fa-info"></i></h3>
  <p><strong>Heads up</strong>: this recipe relies on some code that has been pre-written for you, <a href="https://github.com/themeteorchef/building-a-blog-with-react">available in the recipe's repository on GitHub</a>. During this recipe, our focus will only be on implementing a simple blog using React. If you find yourself asking "we didn't cover that, did we?", make sure to check the source on GitHub.</p>
</div>

<div class="note">
  <h3>Additional Packages <i class="fa fa-warning"></i></h3>
  <p>This recipe relies on several other packages that come as part of <a href="https://github.com/themeteorchef/base/tree/base-react">Base</a>, the boilerplate kit used here on The Meteor Chef. The packages listed below are merely recipe-specific additions to the packages that are included by default in the kit. Make sure to reference the <a href="https://themeteorchef.com/base/packages-included">Packages Included list</a> for Base to ensure you have fulfilled all of the dependencies.</p>
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

The magic of this happens inside of the `isPublic()` method. Notice that we're passing in the current route name via `FlowRouter.getRouteName()`. With this, we simply take the value and test it against an array of route names (pay attention, these are the `name` values defined on our routes, not the paths), seeing if the passed value exists in the array. If it _does_, this means that the route is public and okay to access. If it _doesn't_ exist, that means the route is protected and we should defer to `Meteor.user()` to see if a user is logged in. If they _are_, they see the protected route as expected. If not, they get the `<Login />` component lik we outlined above!

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

Simple enough! Here we create our new collection assigning it to the global variable `Posts` and then set up our `allow` and `deny` rules. Again, this is a security practice. Here, we're saying that we want to deny _all_ database operations on the client and we do not want to allow _any_ database operations on the client (specifically for our `Posts`) collection. This means that later, we'll need to use Meteor methods in order to manage our database. We do this because allow and deny rules are finicky and error prone. Using method's does add a little work to our plate, but gives us peace of mind for later.

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

To do this, we're creating two queries and counting the number of posts returned _by_ those queries. First, we check whether the current slug already exists in the database (we use a [JavaScript RegEx](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) to do this)—notice we filter out this post from the results to avoid renaming its slug with `{ $ne: this.docId }`—returning the number of existing posts with the same slug. Read that a few times! It's a bit of a brain buster. In essence, this returns us the number of posts that have the same `slug` value as the post being inserted or updated, excluding that post from the count.

Next, we do something very similar but this time for posts with the slug `untitled-post`. Wait, what? As we'll see in a little bit, whenever we create a new post we'll be giving it the title "Untitled Post" to start with. Here, we account for this and ensure that the slug value is handled properly. Down below, then, we check whether or not a slug is being passed. If one _is_ passed, we use our `existingSlugCount` suffixing the count plus one of matching posts to the returned value. If no posts exist, we return the value as-is.

If we _do not_ have a slug passed (meaning we're creating a new post and want this to be automated), we check our `existingUntitled` count and update the slug in the exact same way we handle existing slugs. Woah. This is a pretty powerful chunk of code, so read it over a few times! This will save us and the HD Buff team a lot of frustration later.

Phew. We're making good progress but we still have a lot to do. Let's keep chuggin'. Next up, we need to implement our ability to insert new posts and then display a list of those posts for editors to select from.

#### Creating and listing posts for editors
All right! Now we're getting in to the meat of this recipe. Now, we need a way to do two things: create a new posts and list all of the posts in the system for the HD Buff team. To start, let's scope out the basic structure of our component along with its listing feature. Pay close attention as we'll be making reference to a few things that we won't cover directly but will link up to the code for.

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

If we look back at our component real quick, we can see that we're taking the returned post ID from our method (remember, when we call .insert() on a collection without a callback, Meteor returns the new document's `_id` value) and redirecting to the "editor" view for working on our post <code>FlowRouter.go( '/posts/${ postId }/edit' );</code>. This is our next stop! Now we need to wire up our editor to actually manage and publish posts.

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

```

<div class="note">
  <h3>Why not use a component? <i class="fa fa-warning"></i></h3>
  <p>As of writing, adding third-party components is tricky. The original scope for this recipe was to include a token input, however, the experience of implementing it was confusing to say the least. Unless you're comfortable getting your hands dirty, usage of third-party components is unadvised until Meteor adds proper support for <code>require</code> in Meteor 1.3.</p>
</div>

### Listing posts in the index
### Creating tag pages
### Wrap up & summary