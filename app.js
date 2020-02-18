const {Component} = React;
const {render} = ReactDOM;
const { HashRouter, Route, Link, Switch, Redirect } = ReactRouterDOM

const API = 'https://acme-users-api-rev.herokuapp.com/api';

const fetchUser = async ()=> {
    const storage = window.localStorage;
    const userId = storage.getItem('userId'); 
    if(userId){
    try {
        return (await axios.get(`${API}/users/detail/${userId}`)).data;
    }
    catch(ex){
        storage.removeItem('userId');
        return fetchUser();
    }
    }
    const user = (await axios.get(`${API}/users/random`)).data;
    storage.setItem('userId', user.id);
    return  user;
};



const fetchBookmarks = async userId => {
    return (await axios.get(`${API}/users/${userId}/bookmarks`)).data
  }

const createCategories = bookmarks => {
    const categories = bookmarks.reduce((acc, bookmark) => {
        if (!acc.hasOwnProperty(bookmark.category)) {
            acc[bookmark.category] = 1}
        else {
            acc[bookmark.category] += 1}
        return acc
    }, {})
    categories.all = bookmarks.length 
    return categories
}




const Nav = ({path, categories}) =>{
    const currCategories = Object.keys(categories)

    return(
        <div className = 'nav'>
            {currCategories.map(cat =>{
                return (
                    <div key = {cat} className= {path === `${cat}` ? 'selected' : ''}>
                        <nav>
                        <Link to= {`/${cat}`} >{cat} ()</Link>
                        </nav>
                    </div>
                )
            })}
        </div>
    )
}



class CreateBookmark extends Component{
    constructor() {
        super()
        this.state = {
          category: '',
          url: ''
        }
        this.createNew = this.createNew.bind(this)
    }

    createNew(category, url){
        const bookmark = { category, url }
        this.props
            .create(bookmark)
            .then(() => this.props.history.push(`/${category}`))
            .then(this.setState({category: '',url: ''})
        )
      }

    render(){
        const { url, category } = this.state;
        return (
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
                onChange={ev =>this.setState({ category: ev.target.value})}
              />
              <button
                disabled={!url || !category ? 'disabled' : ''}
                onClick={() => {this.createNew(category, url)}}>
                Create
              </button>
            </form>
          )
    }
}




const Bookmarks = ({ path, bookmarks, destroy }) => {
    const renderBookmarks = bookmarks => {
      return bookmarks.map(bookmark => {
        return (
          <li className="bookmarks" key={bookmark.id}>
            <a href={`${bookmark.url}`} target="_blank">{bookmark.url}</a>
            <button onClick={() => { destroy(bookmark) }}>Destory</button>
          </li>
        )
      })
    }

    if (path === 'all') {
      return <ul>{renderBookmarks(bookmarks)}</ul>
    } 
    else {
      const path = bookmarks.filter( bookmark => bookmark.category === path )
      return <ul>{renderBookmarks(path)}</ul>
    }
  }

class App extends Component{

    constructor(){
        super();
        this.state= {
            bookmarks: [],
            user:{},
            categories: [],
        }
        this.create = this.create.bind(this)
        this.destroy = this.destroy.bind(this)

    }


    async componentDidMount(){
        const user = await fetchUser();
        const bookmarks = (await fetchBookmarks(user.id))
        const categories = createCategories(bookmarks)
        this.setState({ bookmarks, user, categories });
    }


    async destroy(bookmark){
        const { user, bookmarks } = this.state
        await axios.delete(`${API}/users/${user.id}/bookmarks/${bookmark.id}`);

        const newBooks = bookmarks.filter( mark => mark.id !== bookmark.id)
          this.setState({ bookmarks : newBooks, categories: createCategories(newBooks)});
    }


    async create(bookmark){
        const { category, url } = bookmark
        const { user, bookmarks } = this.state
        const created = (await axios.post(`${API}/users/${user.id}/bookmarks/`, { category, url }).data)
        this.setState({ bookmarks: [...bookmarks, created],categories: createCategories([...bookmarks, created]) })
    }


    render(){
        const {categories, bookmarks, user}=this.state
        const {create, destroy} = this
        return (
            <HashRouter>
                <h1>{ user.id ? user.fullName : '' } ({this.state.bookmarks.length})</h1>
                <Route
                path="/:path?"
                render={({ history, match }) => (
                  <main>
                    <Nav  path={match.params.filter} categories={categories} />
                    <CreateBookmark history={history} create={create} />
                    <Bookmarks path={match.params.filter} bookmarks={bookmarks} destroy={destroy}/>
                  </main>
                )}
              />
            </HashRouter>
        )
    }
}



const root = document.querySelector('#root');
ReactDOM.render(<App />, root);