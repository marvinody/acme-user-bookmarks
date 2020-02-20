const { Component } = React
const { render } = ReactDOM
const { HashRouter, Route, Link, Switch, Redirect } = ReactRouterDOM

const API = 'https://acme-users-api-rev.herokuapp.com/api'

const fetchUser = async () => {
  const storage = window.localStorage
  const userId = storage.getItem('userId')
  if (userId) {
    try {
      return (await axios.get(`${API}/users/detail/${userId}`)).data
    }
    catch (ex) {
      storage.removeItem('userId')
      return fetchUser()
    }
  }
  const user = (await axios.get(`${API}/users/random`)).data
  storage.setItem('userId', user.id)
  return user
}

// I like imitating functions you have
const fetchBookmarks = async userId => {
  return (await axios.get(`${API}/users/${userId}/bookmarks`)).data
}

// good function!
const createCategories = bookmarks => {
  const categories = bookmarks.reduce((acc, bookmark) => {
    if (!acc.hasOwnProperty(bookmark.category)) {
      acc[bookmark.category] = 1
    }
    else {
      acc[bookmark.category] += 1
    }
    return acc
  }, {})
  categories.all = bookmarks.length
  // yes! it looks ok! makes sense
  // my attempt at getting the numbers to show next to nav bar categories
  return categories
}


const Nav = ({ path, categories }) => {
  console.log(path)
  const currCategories = Object.keys(categories)

  return (
    <div className="nav">
      {currCategories.map(cat => {
        return (
          <div key={cat} className={path === `/${cat}` ? 'selected' : ''}>
            {/* just need to remove the slash from cat! */}
            {/* the selected className isnt being added properly */}
            <nav>
              {/* very close to it, I think doing something like currCats[cat] would give you length */}
              <Link to={`/${cat}`} >{cat} ()</Link>
            </nav>
          </div>
        )
      })}
    </div>
  )
}


class CreateBookmark extends Component {
  constructor() {
    super()
    this.state = {
      category: '',
      url: ''
    }
    this.createNew = this.createNew.bind(this)
  }

  createNew(category, url) {
    const bookmark = { category, url }
    this.props
      .create(bookmark)
      .then(() => this.props.history.push(`/${category}`))
      // what was the point of this line?
      .then(this.setState({ category: `${category}`, url: `${url}` }))
  }

  render() {
    const { url, category } = this.state
    return (
      // in your form submit, you probably wanna do the this.createNew call here too
      // AFTER the preventDefault
      // but don't attach it to the click
      <form id="createBookmark" onSubmit={ev => ev.preventDefault()}>
        <input
          name="url"
          placeholder="enter url here"
          value={url}
          onChange={ev => this.setState({ url: ev.target.value })}
        />
        <input
          name="category"
          placeholder="enter category here"
          value={category}
          onChange={ev => this.setState({ category: ev.target.value })}
        />
        <button
          disabled={!url || !category ? 'disabled' : ''}
          // this click. don't do this
          // I can hit enter and nothing will happen. Enter generally submits a form
          // you're breaking my ux!
          onClick={() => { this.createNew(category, url) }}>
          Create
        </button>
      </form>
    )
  }
}


const Bookmarks = ({ path, bookmarks, destroy }) => {
  const renderBookmarks = (bookmarks) => {
    return bookmarks.map(bookmark => {
      return (
        <li className="bookmarks" key={bookmark.id}>
          <a href={`${bookmark.url}`} target="_blank">{bookmark.url}</a>
          {/* this is fine for onclick */}
          <button onClick={() => { destroy(bookmark) }}>Destory</button>
        </li>
      )
    })
  }
  // console.log(path)
  // works!
  if (path === 'all') {
    return <ul>{renderBookmarks(bookmarks)}</ul>
  }
  else {
    const filteredBooks = bookmarks.filter(bookmark => bookmark.category === path)
    return <ul>{renderBookmarks(filteredBooks)}</ul>
  }
}

class App extends Component {

  constructor() {
    super()
    this.state = {
      bookmarks: [],
      user: {},
      categories: [],
    }
    this.create = this.create.bind(this)
    this.destroy = this.destroy.bind(this)

  }


  async componentDidMount() {
    const user = await fetchUser()
    // don't need parens here
    const bookmarks = (await fetchBookmarks(user.id))
    // so categories is a derived value
    // meaning we can figure out categories from stuff in state
    // which means it probably shouldn't be immediately in state
    // cause in the render, we can use bookmarks and gen it!
    // we can talk about why this is an antipattern if you want
    const categories = createCategories(bookmarks)
    this.setState({ bookmarks, user, categories })
  }


  async destroy(bookmark) {
    const { user, bookmarks } = this.state
    await axios.delete(`${API}/users/${user.id}/bookmarks/${bookmark.id}`)

    const newBooks = bookmarks.filter(mark => mark.id !== bookmark.id)
    this.setState({ bookmarks: newBooks, categories: createCategories(newBooks) })
  }


  async create(bookmark) {
    const { category, url } = bookmark
    const { user, bookmarks } = this.state
    const created = (await axios.post(`${API}/users/${user.id}/bookmarks/`, { category, url }).data)
    this.setState({ bookmarks: [...bookmarks, created], categories: createCategories([...bookmarks, created]) })
  }


  render() {
    const { categories, bookmarks, user } = this.state
    const { create, destroy } = this
    return (
      <HashRouter>
        <h1>{user.id ? user.fullName : ''} ({this.state.bookmarks.length})</h1>
        <Route
          path="/:path?"
          render={({ history, match }) => (
            <main>
              <Nav path={match.params.path} categories={categories} />
              <CreateBookmark history={history} create={create} />
              <Bookmarks path={match.params.path} bookmarks={bookmarks} destroy={destroy} />
            </main>
          )}
        />
      </HashRouter>
    )
  }
}

// the state SHOULD reset on a reload
// also why doesnt the state reset on a hard reset or relaod?
// this generally means your setstate is wonky, I think we went over this but I can't recall
// Have to refresh after creating, not sure why


const root = document.querySelector('#root')
ReactDOM.render(<App />, root)
