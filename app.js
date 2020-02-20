const { Component } = React
const { HashRouter, Link, Route, Switch, Redirect } = ReactRouterDOM
const { render } = ReactDOM

const API = 'https://acme-users-api-rev.herokuapp.com/api'

const fetchUser = async () => {
  const storage = window.localStorage
  const userID = storage.getItem('userID')
  if (userID) {
    try {
      return (await axios.get(`${API}/users/detail/${userID}`)).data
    } catch (ex) {
      storage.removeItem('userID')
      return fetchUser()
    }
  }

  const user = (await axios.get(`${API}/users/random`)).data
  storage.setItem('userID', user.id)

  return user
}

// good use of using similar styles in code
const fetchBookmark = async (user) => {
  const bookmark = (await axios.get(`${API}/users/${user}/bookmarks`)).data

  return bookmark
}

// good function
// but the name could be better
const mapBookmark = (bookmark) => {
  return bookmark.reduce((accum, cur) => {
    if (accum[cur.category]) {
      accum[cur.category] = accum[cur.category] + 1
    } else {
      accum[cur.category] = 1
    }
    return accum
  }, {})
}

const Nav = ({ path, bookmarks }) => {
  const titles = Object.keys(bookmarks)

  return (
    <nav>
      {titles.map((title) => {
        return (
          <Link
            to={`/${title}`}
            className={path === `/${title}` ? 'selected' : 'notSelected'}
            key={title}
          >
            {`${title.toUpperCase()} (${bookmarks[title]})`}
          </Link>
        )
      })}
    </nav>
  )
}

const List = ({ user, bookmarks, path, destroy }) => {
  return (
    <ul>
      {bookmarks
        // nice chaining!
        .filter((cur) => {
          const url = path.slice(1)
          if (cur.category === url) {
            return cur
          }
        })
        .map((bookmark) => {
          return (
            <li key={bookmark.id}>
              <a
                href={
                  bookmark.url.slice(0, 4) === 'http'
                    ? bookmark.url
                    : `//${bookmark.url}`
                }
              >
                {bookmark.url}
              </a>
              <button
                // even though destroy returns a promise
                // you don't need to await it!
                // you can just invoke it and let it do its thing
                onClick={async () => {
                  await destroy(bookmark.id)
                }}
              >
                Destroy
              </button>
            </li>
          )
        })}
    </ul>
  )
}
class App extends Component {
  constructor() {
    super()
    this.state = {
      user: {},
      bookmarks: [],
      navBookmark: {},
      inputUrl: '',
      inputCat: '',
      inputRate: 0
    }

    this.destroy = this.destroy.bind(this)
    this.create = this.create.bind(this)
  }

  // should try to batch setState calls if possible
  // setState does some weird things and you may lead into bugs if you use
  // this.state IN your setState
  async componentDidMount() {
    this.setState({ user: await fetchUser() })
    this.setState({ bookmarks: await fetchBookmark(this.state.user.id) })
    this.setState({ navBookmark: mapBookmark(this.state.bookmarks) })
  }

  async create(userUrl, userCategory, userRating) {
    // post returns something here. can you do something with that?
    await axios.post(`${API}/users/${this.state.user.id}/bookmarks`, {
      category: userCategory,
      url: userUrl,
      rating: userRating
    })
    // you're just refetching everything again. what if you had 1000 things
    //  and you just reloaded everything
    // ouch
    this.setState({ bookmarks: await fetchBookmark(this.state.user.id) })
    this.setState({ navBookmark: mapBookmark(this.state.bookmarks) })
  }

  async destroy(bookmarkID) {
    // this is ok tho. delete doesn't return anything
    await axios.delete(
      `${API}/users/${this.state.user.id}/bookmarks/${bookmarkID}`
    )
    // but there's a way to make this more efficient
    this.setState({ bookmarks: await fetchBookmark(this.state.user.id) })
    this.setState({ navBookmark: mapBookmark(this.state.bookmarks) })
  }

  render() {
    const {
      user,
      bookmarks,
      navBookmark,
      inputUrl,
      inputCat,
      inputRate
    } = this.state
    const { destroy, create } = this

    if (bookmarks.length === 10) {
      alert('This is your last bookmark to add more please remove a bookmark')
    }
    return (
      <div>
        <h1>{`${user.fullName} (${bookmarks.length} Bookmarks)`}</h1>
        <HashRouter>
          <Switch>
            <Route
              render={({ location }) => {
                return (
                  <Nav path={location.pathname} bookmarks={navBookmark} />
                )
              }}
            />
          </Switch>
        </HashRouter>
        <form>
          <input
            placeholder="url"
            value={inputUrl}
            onChange={(ev) => this.setState({ inputUrl: ev.target.value })}
          />
          <input
            placeholder="category"
            value={inputCat}
            onChange={(ev) => this.setState({ inputCat: ev.target.value })}
          />
          <button
            onClick={async () => {
              await create(inputUrl, inputCat, inputRate)
            }}
          >
            Create
          </button>
        </form>
        <HashRouter>
          <Route
            render={({ location }) => (
              <List
                bookmarks={bookmarks}
                user={user}
                path={location.pathname}
                destroy={destroy}
              />
            )}
          />
        </HashRouter>
      </div>
    )
  }
}
