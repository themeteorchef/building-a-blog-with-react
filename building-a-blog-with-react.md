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
- **Difficulty**: Intermediate
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

#### Setting up a collection and schema
#### Saving content
<div class="note">
  <h3>Why not use a component? <i class="fa fa-warning"></i></h3>
  <p>As of writing, adding third-party components is tricky. The original scope for this recipe was to include a token input, however, the experience of implementing it was confusing to say the least. Unless you're comfortable getting your hands dirty, usage of third-party components is unadvised until Meteor adds proper support for <code>require</code> in Meteor 1.3.</p>
</div>
### Listing posts in the index
### Creating tag pages
### Wrap up & summary