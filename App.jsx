import React from "react";
import "whatwg-fetch";

export class App extends React.Component {
    constructor (props) {
        super();

        let authMatch = window.location.search.match(/auth=([^&]*)/);
        let auth;

        if(authMatch === null && !props) {
            alert("Could not find auth, nothing will work");
            auth="";
        } else {
            auth = authMatch ? authMatch[1] : props.auth;
        }

        this.state = {
            apiKey: auth,
            currentCompany: 1,
            companyInfo: {},
            newCompanyInfo: {},
            nestedCats: [],
            companyCats: {},
            newCompanyCats: {},
            allCompanies: []
        };

        this.getCompanies();
    }

    getCompanies() {
        if (this.state.apiKey) {
            apiPostRequest("getCompanyListing.php", {auth: this.state.apiKey}, (comps) => this.setState({allCompanies: comps}));
        }
        
    }


    componentDidMount() {
        this.fetchCompanyInformation(this.state.currentCompany);
        this.fetchNestedCats();
    }


    changeCompanyInfo(key, val) {
        let newCompInfoCopy = JSON.parse(JSON.stringify(this.state.newCompanyInfo));
        newCompInfoCopy[key] = val;
        this.setState({newCompanyInfo : newCompInfoCopy});
    }

    changeCompany(newComp) {
        this.setState({currentCompany : newComp});
        this.setState({newCompanyInfo : {}});
        this.setState({companyCats : {}});
        this.setState({newCompanyCats: []});
        this.fetchCompanyInformation(newComp);
    }

    fetchCompanyInformation(compID) {
        if (this.state.apiKey) {
            this.setState({companyInfo : {}});
            apiPostRequest("getCompanyInfo.php", {auth : this.state.apiKey, id : compID}, (respJson) => this.setState({companyInfo : respJson.basicInfo, companyCats : respJson.cats, newCompanyCats : Object.keys(respJson.cats).map(k => parseInt(k))}));
        }
        
    }

    fetchNestedCats() {
        if (this.state.apiKey) {
            apiPostRequest("getAllNestedCats.php", {auth : this.state.apiKey}, (respJson) => this.setState({nestedCats : respJson}));
        }
    }

    catCheckedChange(id) {
        let currentCats = this.state.newCompanyCats;

        let position = currentCats.indexOf(id);
        if (position === -1) {
            this.setState({newCompanyCats : currentCats.concat([id])})
        } else {
            let currentCatsCopy = currentCats.slice();
            currentCatsCopy.splice(position, 1);
            this.setState({newCompanyCats : currentCatsCopy})
        }

    }

    saveCallBack(setButtonTextCB) {

        let oldCompCatIDS = Object.keys(this.state.companyCats).map(k => parseInt(k));
        let addedCatIDS = this.state.newCompanyCats.filter(c => oldCompCatIDS.indexOf(c) === -1);
        let removedCatIDS = oldCompCatIDS.filter(c => this.state.newCompanyCats.indexOf(c) === -1);
        let removedCatRELIDS = removedCatIDS.map(cid => this.state.companyCats[cid]["relID"]);

        let newInfo = this.state.newCompanyInfo;
        let oldInfo = this.state.companyInfo;

        let sendInfo = {};

        Object.keys(oldInfo).forEach(function (k){
            sendInfo[k] = (newInfo[k] !== undefined ? newInfo[k] : oldInfo[k]);
        });

        var postData = {
            addCats : JSON.stringify(addedCatIDS),
            removeCats : JSON.stringify(removedCatRELIDS),
            basicInfo : JSON.stringify(sendInfo),
            auth : this.state.apiKey
        };

        apiPostRequest("saveCompanyInfoAndCats.php", postData, (resp) => {
            let rowsEdited = resp.basicInfoRowsEdited;
            let addedCats = resp.addedCats.length;
            let removedCats = resp.removedCatRelIDS.length;

            let result = `edited ${rowsEdited} rows and ${addedCats + removedCats} cats`;
            setButtonTextCB(result,  "btn btn-success", 1500);
            this.changeCompany(this.state.currentCompany);
        });




    }

    render () {
        return (
            <div>

                <div className="container">
                    <h1 style={{textAlign : "center"}}>Comp Editor v2</h1>

                    <div className="row well">
                        <SearchBar companies={this.state.allCompanies} currentCompany={this.state.currentCompany} changeResultCallback={this.changeCompany.bind(this)} />

                        <div className="hidden-md hidden-lg mobile-sep">
                            <hr/>
                        </div>

                        {/* Props hell */}
                        <MainContent saveCallBack={this.saveCallBack.bind(this)} onCheckedCallBack={this.catCheckedChange.bind(this)} companyCats={this.state.newCompanyCats} newCompInfo={this.state.newCompanyInfo} changeCompanyInfoCallback={this.changeCompanyInfo.bind(this)} nestedCats={this.state.nestedCats} compInfo={this.state.companyInfo} />


                    </div>
                </div>
            </div>


        );

    }
}


export class MainContent extends React.Component {
    constructor() {
        super();
        this.state = {
            activeTab: 0
        }

    }

    changeTab(tabNum) {
        this.setState({"activeTab" : tabNum});
    }

    getTab(tabNum) {

        //pass the entire company object, not just the id
        return [
            <BasicInfoTab saveCallBack={this.props.saveCallBack} changeCompanyInfoCallback={this.props.changeCompanyInfoCallback} compInfo={this.props.compInfo} newCompInfo={this.props.newCompInfo}/> ,
            <CategoriesTab onCheckedCallBack={this.props.onCheckedCallBack} nestedCats={this.props.nestedCats} companyCats={this.props.companyCats} />,
            <AdminTab />
        ][tabNum];
    }



    render() {
        return (
            <div className="col-md-9 main-content">
                <h3 className="col-header">Company Information</h3>
                <Navbar changeTabCallback={this.changeTab.bind(this)} activeTab={this.state.activeTab}/>
                {this.getTab(this.state.activeTab)}
            </div>
        );
    }
}
export class AdminTab extends React.Component {
    render () {
        return (
            <div>
                <h3>Coming soon....</h3>
                <ul>
                    <li>Delete this company</li>
                    <li>Copy company categories</li>
                    <li>Apply company categories to other companies</li>
                </ul>
            </div>

        );
    }
}

export class CategoriesTab extends React.Component {
    render() {
        let catKeys = Object.keys(this.props.nestedCats);
        let cats = this.props.nestedCats;
        let companyCats = this.props.companyCats;

        return (
            <div style={{marginTop : 10}}>
                <ul>
                    {catKeys.map((k) => <CategoryElement
                        checkedCats={companyCats}
                        key={cats[k].id}
                        catInfo={cats[k]}
                        onCheckedCallBack={this.props.onCheckedCallBack}
                    />)}
                </ul>
            </div>
        );
    }

}

export class CategoryElement extends React.Component {

    //Todo: Unchecking an element should uncheck all it's children

    constructor() {
        super();
        this.state = {
            childrenHidden : true
        }
    }

    onChecked () {
        this.setState({childrenHidden : this.isChecked()});
        this.props.onCheckedCallBack(this.props.catInfo.id);
    }

    toggleChildren() {

        let newChildrenHidden = !this.state.childrenHidden;
        this.setState({childrenHidden : newChildrenHidden});

    }

    isChecked() {
        let id = this.props.catInfo.id;
        return this.props.checkedCats.indexOf(id) !== -1;
    }


    render () {
        let children = this.props.catInfo.children;
        let childrenKeys = Object.keys(children);
        let isCurrentlyChecked = this.isChecked();

        return (

                <li key={this.props.catInfo.id}>
                    <div className="checkbox">
                        <label>
                            <input checked={isCurrentlyChecked} onChange={this.onChecked.bind(this)} type="checkbox" />
                            {this.props.catInfo.name}

                        </label>
                        {childrenKeys.length ? <a className="check-a" onClick={this.toggleChildren.bind(this)}>{this.state.childrenHidden ? "[+" + childrenKeys.length + "]" : "[-]"}</a> : ""}
                    </div>

                    {(childrenKeys.length  && !this.state.childrenHidden)? <ul>{childrenKeys.map(k => <CategoryElement onCheckedCallBack={this.props.onCheckedCallBack} checkedCats={this.props.checkedCats} key={children[k].id} catInfo={children[k]} />)} </ul> : ""}
                </li>
        );
    }
}

export class BasicInfoTab extends React.Component {
    render() {
        return (
            <div>
                <h3>{this.props.compInfo.name || "Loading..."}</h3>
                <hr />


                <BasicInfoTextBox cb={this.props.changeCompanyInfoCallback} dataName="website" oldInfo={this.props.compInfo} newInfo={this.props.newCompInfo} />
                <BasicInfoTextBox cb={this.props.changeCompanyInfoCallback} dataName="facebookURL" oldInfo={this.props.compInfo} newInfo={this.props.newCompInfo} />
                <BasicInfoTextBox cb={this.props.changeCompanyInfoCallback} dataName="twitter" oldInfo={this.props.compInfo} newInfo={this.props.newCompInfo} />
                <BasicInfoTextBox cb={this.props.changeCompanyInfoCallback} dataName="contactPhone" oldInfo={this.props.compInfo} newInfo={this.props.newCompInfo} />
                <BasicInfoTextBox cb={this.props.changeCompanyInfoCallback} dataName="contactEmail" oldInfo={this.props.compInfo} newInfo={this.props.newCompInfo} />


                {/* Is it worth making a component when I only have a single textarea? */}
                <div className="row form-marg">
                    <div className="col-lg-12">
                        <label htmlFor="description">Description</label>
                        <textarea
                            value={this.props.newCompInfo.description || this.props.compInfo.description}
                            className="form-control"
                            style={{height : 150}}
                            type="text"
                            id={"description"}
                            placeholder={this.props.dataName}
                            onChange={(e) => this.props.changeCompanyInfoCallback("description", e.target.value)}
                        />
                        <SaveButton saveCallBack={this.props.saveCallBack}/>


                    </div>



                </div>

            </div>
        );
    }

}

export class SaveButton extends React.Component {
    constructor() {
        super();
        this.state = {text: "Save!", cssClasses : "btn btn-primary"};
    }

    
    setButtonForTime(text, classes, time) {
        //TODO ES6 this later
        let oldText = this.state.text;
        let oldClasses = this.state.cssClasses;
        this.setState({text : text, cssClasses : classes});

        setTimeout(() => this.setState({text : oldText, cssClasses : oldClasses}), time);
    }
    render() {

        let customStyle = {
            transition: "all 0.5s ease",
            marginTop: 10,
            width:"100%"
        };
        return (
            <button onClick={() => {this.props.saveCallBack(this.setButtonForTime.bind(this))}} style={customStyle} className={this.state.cssClasses}>{this.state.text}</button>
        );
    }

}

export class BasicInfoTextBox extends React.Component {

    changeHandler(e) {
        
        this.props.cb(this.props.dataName, e.target.value);
    }
    render () {

        let key = this.props.dataName;
        let oldValue = this.props.oldInfo[key];
        let newValue = this.props.newInfo[key];


        let customStyle = {
            border: (newValue !== undefined && newValue !== oldValue)? "1px solid #0ce3ac" : ""
        };



        return (
            <div className="row form-marg">
                <div className="col-lg-2">
                    <label htmlFor={this.props.dataName}>{this.props.dataName}</label>
                </div>
                <div className="col-lg-10">
                    {/* The below short circuiting fixes the `is changing an uncontrolled input of type to controlled` error */}
                    <input
                        style={customStyle}
                        value={newValue !== undefined ? newValue || "" : oldValue || ""}
                        className="form-control sm-input col-lg-10"
                        type="text"
                        id={this.props.dataName}
                        placeholder={this.props.dataName}
                        onChange={this.changeHandler.bind(this)}
                    />
                </div>
            </div>
        );
    }
}


export class Navbar extends React.Component {
    getTabItem(activeTab, tabID, text) {
        return (
            <li onClick={() => this.props.changeTabCallback(tabID)} className={activeTab == tabID ? "active" : ""}>
            <a href="#a" data-toggle="tab" aria-expanded="false">
                {text}
            </a>
        </li>
        );
    }


    render() {
        return (
            <ul className="nav nav-tabs">
                {this.getTabItem(this.props.activeTab, 0, "Basic Info")}
                {this.getTabItem(this.props.activeTab, 1, "Categories")}
                {this.getTabItem(this.props.activeTab, 2, "Admin")}
            </ul>
        );
    }

}

export class SearchBar extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        /* HUGE OPTIMIZATION */

        return  this.props.companies != nextProps.companies ||
                this.state.searchFilter != nextState.searchFilter ||
                this.props.currentCompany != nextProps.currentCompany;

    }

    constructor (props) {
        super(props);
        this.state = {
            searchFilter : ""
        };
    }



    searchFilter(cmp) {
        return cmp.name.toLowerCase().indexOf(this.state.searchFilter.toLowerCase()) !== -1;
    }

    changeSearchFilter(e) {
        this.setState({searchFilter : e.target.value});
    }
    render () {
        return (
            <div className="col-md-3 left-bar">
                <h3 className="col-header">Companies</h3>
                <hr/>
                <input onChange={this.changeSearchFilter.bind(this)} type="text" placeholder="search" className="form-control search sm-input"/>

                <div className="companies-holder">
                    {

                        this.props.companies.length ?
                        this.props.companies
                            .filter(this.searchFilter.bind(this))
                            .map(cmp => <SearchResult isActive={this.props.currentCompany == cmp.id} clickResultCallback={this.props.changeResultCallback} key={cmp.id} id={cmp.id} name={cmp.name} />) :
                        <div className="com-item">Loading...</div>
                    }
                </div>
            </div>
        );
    }
}

export class SearchResult extends React.Component {

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.isActive != this.props.isActive;
    }
    render() {

        let customStyle = {};
        if (this.props.isActive) {
            customStyle["backgroundColor"] = "#222222";
        }

        return (
            <div href="#a" style={customStyle} onClick={() => this.props.clickResultCallback(this.props.id)} className="com-item">
                {this.props.id + ". " + this.props.name}
            </div>
        )
    }
}

export function generateForm(dataObj) {
    let keys = Object.keys(dataObj);
    let fullString = "";

    let indivudalParamStrings = keys.map(key => key + "=" + encodeURIComponent(dataObj[key]));
    return indivudalParamStrings.join("&");


}

export function apiPostRequest(endpoint, data, cb) {
    let postData = {
        method : "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        body: generateForm(data)
    };

    fetch("http://digsto.com/api/" + endpoint, postData)
        .then((response) => response.json())
        .then((responseJson) => {
            cb(responseJson);
        }).catch(error => {
            alert("Problem with network request, your auth is bad or the api is down. Check console for full error");
            console.error(error);
        });

}

export default App;
