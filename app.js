const { Component } = React;
const { render } = ReactDOM;
const { HashRouter, Link, Route, Switch, Redirect } = ReactRouterDOM;
const API = "https://acme-users-api-rev.herokuapp.com/api";

const fetchUser = async () => {
  const storage = window.localStorage;
  const userId = storage.getItem("userId");
  if (userId) {
    try {
      return (await axios.get(`${API}/users/detail/${userId}`)).data;
    } catch (ex) {
      storage.removeItem("userId");
      return fetchUser();
    }
  }
  const user = (await axios.get(`${API}/users/random`)).data;
  storage.setItem("userId", user.id);
  return user;
};

const Nav = ({ match, create, history, user, bookmarks }) => {
  const bookmarked = bookmarks.filter(bookmark => bookmark.category);

  const {
    params: { filter }
  } = match;
  return (
    <div>
      <nav>
        <Link
          to="/entertainment"
          className={filter === "entertainment" ? "selected" : ""}
        >
          Entertainment
        </Link>
        <Link
          to="/shopping"
          className={filter === "shopping" ? "selected" : ""}
        >
          Shopping
        </Link>
        <Link to="/travel" className={filter === "travel" ? "selected" : ""}>
          Travel
        </Link>
      </nav>
      <FormInput create={create} history={history} />
    </div>
  );
};

const Bookmarks = ({ bookmarks, update, destroy, match }) => {
  const {
    params: { filter }
  } = match;

  return (
    <ul>
      {bookmarks
        .filter(bookmark => bookmark.category === filter)
        .map(bookmark => {
          return (
            <li className="urls" key={bookmark.id}>
              {bookmark.url}
              <button className="destroy" onClick={() => destroy(bookmark)}>
                Destroy
              </button>
            </li>
          );
        })}
    </ul>
  );
};

class FormInput extends Component {
  constructor(user) {
    super();
    this.state = {
      url: "",
      category: ""
    };
    this.onSubmit = this.onSubmit.bind(this);
  }
  onSubmit(ev) {
    ev.preventDefault();
    this.props.create(this.state.url, this.state.category);
  }
  render() {
    return (
      <form onSubmit={ev => this.onSubmit(ev)}>
        <input
          name="url"
          value={this.state.url}
          onChange={ev => this.setState({ url: ev.target.value })}
        ></input>
        <input
          name="category"
          value={this.state.category}
          onChange={ev => this.setState({ category: ev.target.value })}
        ></input>
        <button className="create">Create</button>
      </form>
    );
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      user: {},
      bookmarks: []
    };
    this.create = this.create.bind(this);
    this.destroy = this.destroy.bind(this);
  }
  async componentDidMount() {
    const user = await fetchUser();
    const bookmarks = (await axios.get(`${API}/users/${user.id}/bookmarks`))
      .data;
    this.setState({ user, bookmarks });
  }
  async destroy(bookmark) {
    const { user, bookmarks } = this.state;
    await axios.delete(`${API}/users/${user.id}/bookmarks/${bookmark.id}`);
    this.setState({
      bookmarks: bookmarks.filter(bkmk => bkmk.id !== bookmark.id)
    });
  }
  async create(url, category) {
    const { user, bookmarks } = this.state;
    const bookmark = (
      await axios.post(`${API}/users/${user.id}/bookmarks`, {
        url: url,
        category: category
      })
    ).data;
    this.setState({ bookmarks: [...bookmarks, bookmark] });
  }
  render() {
    const { user, bookmarks } = this.state;
    return (
      <HashRouter>
        <h1>
          {user.fullName} has {bookmarks.length} Bookmarks
        </h1>
        <Route
          path="/:filter?"
          render={props => (
            <main>
              <Nav
                {...props}
                user={user}
                bookmarks={bookmarks}
                create={this.create}
              />
              <Bookmarks
                {...props}
                destroy={this.destroy}
                bookmarks={bookmarks}
              />
            </main>
          )}
        />
      </HashRouter>
    );
  }
}
const root = document.querySelector("#root");
render(<App />, root);
