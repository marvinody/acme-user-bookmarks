const API = 'https://acme-users-api-rev.herokuapp.com/api';

// HELPER FUNCTIONS ----- >
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


  const helperCountFunc = (nav) => {
    let uniqueCount = [];
    var count = {};
    nav.forEach(link => {
        // console.log(link)
        uniqueCount.push( Object.values(link)[3])
    });

    uniqueCount.forEach((i) => { 
        count[i] = (count[i] || 0 ) + 1;
    });
    return count;
  }

  // ------------------ >

  const { Component } = React;
  const { render } = ReactDOM;
  const { Link, Redirect, Route, HashRouter, Switch} = ReactRouterDOM;
  const root = document.getElementById('root');

  const Loading = () => {
      return(
        <section className="centerMe">
            <div className="lds-grid"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
        </section>
      )
  }

  class Form extends Component {
      constructor(props){
          const {url, category} = props
          super(props);
          this.state ={
            url: '',
            category: '',
            notValid:false
          }
          this.create = this.create.bind(this);
      }

      create() {
         const {updateOnChange} = this.props;
         const {url, category} = this.state;
         console.log(url, category)
         if (url === '' && category === '') {
            this.setState({notValid: true})
            return window.alert('please enter an url and a category')
         } else if(url === '' || category === '') {
            this.setState({notValid: true})
            return window.alert('please check your form')
         }

         updateOnChange(url, category);

         this.setState({
             url: '',
             category: '',
             notValid: false
         })
      }

      render(){
          const {notValid} = this.state;
          const {create} = this;
        //   console.log(url);
        //   console.log(category);  
          return(
            <form className="ui form" onSubmit={ e => { e.preventDefault(); e.target.reset();}}>
            <div className="field">
              <label className='hide'>url</label>
              <input className={notValid ? 'missingInfo' : null} type="text" name="url" placeholder='url' onChange={ (e)=> this.setState({ url: e.target.value})}/>
              <span className={notValid ? 'show' : 'hide'}><i class="fas fa-exclamation-triangle"></i> url is required</span>
            </div>
            <div className="field">
              <label className="hide">category</label>
              <input  className={notValid ? 'missingInfo' : null} type="text" name="category" placeholder='Category' onChange={(e) => this.setState({category: e.target.value})}/>
              <span className={notValid ? 'show' : 'hide'}><i class="fas fa-exclamation-triangle"></i> category is required</span>
            </div>
            <button className="ui button" type="submit" onClick ={create}>Submit</button>
          </form>

          )
      }
  }


  const List = (props) => {
      const {deleteOnChange} = props;
      let hash = window.location.hash.slice(2);
    //   console.log(hash)
      const {bookMarks} = props;
    //   console.log(bookMarks)
      let list = bookMarks.filter(bookMark => bookMark.category === hash)
    //   console.log(list);
      const deleteMe = (e) => {
      const bookmarkId = e.target.id;
    //   console.log(bookmarkId);
      deleteOnChange(bookmarkId);  
    }
      
    return (
    <div className="item-parent">
    {
        list.map(item => {
            return (
            <div key={item.id} className={`ui ${item.category} label`}><a href={item.url} target="_blank">{item.url.slice(8,)}</a><div className="detail"><a onClick= {(e) => deleteMe(e)} id={item.id}>Delete</a></div></div>    
            )
        })
    }
   </div>
    );
}


  const Nav = (props) => {
      const { path, user, bookMarks, deleteOnChange} = props; 
      const pathname = path.location.pathname.slice(1);
      console.log(pathname);
      let navArray = helperCountFunc(bookMarks);
      let nav = []

      for (const link in navArray) {
        //   console.log(link)
        nav.push(<li key={link}><Link className={`${pathname === link ? 'selected' : null}`} to={`/${link}`}>{`${link} (${navArray[link]})`}</Link></li>);
      }
      const {fullName} = user;
    //   console.log(user)
      const numOfBookmakrs = bookMarks.length;

      if(nav.length === 0) {
        window.location.hash = "/";
    }
    return(
        
        <div>
            <nav>
            <h1>{fullName} ({numOfBookmakrs} {(bookMarks.length > 0) ? 'Bookmarks' : 'Bookmark'}) </h1>
           <ul className="nav"id="parent">
            {
                nav.map(link => link)
            }
           </ul>
        </nav>
        <div className="ui vertical divider">{`${fullName}`}</div>

        <List bookMarks={bookMarks} deleteOnChange= {deleteOnChange}/>
        </div>


        
    );
  }

  class App extends Component {
      constructor(){
          super();
          this.state = {
              user:[],
              loading : true, 
              bookMarks : [],
              url: 'URL',
              category: 'Category'
          }
        this.updateOnChange = this.updateOnChange.bind(this);
        this.deleteOnChange = this.deleteOnChange.bind(this);

      }
      componentDidMount () {
        const getUser = async () => {
            const user = await fetchUser();
            const bookMarks =  ( await axios.get(`${API}/users/${user.id}/bookmarks`)).data;
            this.setState({
                user, 
                bookMarks, 
                loading: false
            })
            
        }
        getUser();
    }
        async updateOnChange (valOne, valTwo){
            const {user} = this.state;
            // console.log(user.id)
            // console.log(`https://${valOne}.com`);
            // console.log(valTwo);
            const update = (await axios.post(`${API}/users/${user.id}/bookmarks`, {
                url: `https://www.${valOne}.com`, 
                rating:0,
                category:valTwo,
            })).data;
            console.log(update)
            this.setState({ bookMarks : this.state.bookMarks.concat(update) });
            // console.log(bookMarks); 
        }

        async deleteOnChange (id) {
           const {user} = this.state;
            console.log(this.state.user)
            await axios.delete(`${API}/users/${user.id}/bookmarks/${id}`);
            console.log(`${API}/users/${user.id}/bookmarks/${id}`);
            this.setState({bookMarks : this.state.bookMarks.filter(_bookmark => _bookmark.id !== id) });


        }
      
      render(){
          const { user, bookMarks, loading, url, category } = this.state;
          const { updateOnChange, deleteOnChange } = this;
          if(loading) return <Loading/>;
        //   console.log(user);
        //   console.log(bookMarks);

          return(
              <main>
              <HashRouter>  
                <Route path="/:bookmark?"  render={ (props) => <Nav path={props} user={user} bookMarks={bookMarks} url={url} category={category} deleteOnChange = {deleteOnChange} /> }/>
              </HashRouter>

                <Form url={url} category={category} updateOnChange={updateOnChange} />
            </main>
          );
      }
  }

  render(<App />, root );