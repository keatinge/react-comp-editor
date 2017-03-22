import expect from "expect";
import React from "react";
import {shallow, mount} from "enzyme";
import 'isomorphic-fetch';
var sinon = require("sinon")
import {App, SearchBar, BasicInfoTab, CategoriesTab, CategoryElement, generateForm,}  from "../App.jsx";


var jsdom = require('jsdom').jsdom;

global.document = jsdom('');
global.window = document.defaultView;
Object.keys(document.defaultView).forEach((property) => {
    if (typeof global[property] === 'undefined') {
        global[property] = document.defaultView[property];
    }
});

global.navigator = {
    userAgent: 'node.js'
};


describe("generate form function", function () {
    it("should generate forms properly for multiple basic values", function () {
        let myPets = {
            "dogName": "Winston",
            "catName": "Katniss",
            "auth": "abc123"
        };
        expect(generateForm(myPets)).toEqual("dogName=Winston&catName=Katniss&auth=abc123");
    });

    it("should be able to handle json encoded objects", function () {
        let fakeCompanyInfo = {
            "companyName": "facebook",
            "contactEmail": "someone@gmail.com"
        };
        let postObj = {
            basicInfo: JSON.stringify(fakeCompanyInfo)
        };

        //generated with http://meyerweb.com/eric/tools/dencoder/
        expect(generateForm(postObj)).toEqual("basicInfo=%7B%22companyName%22%3A%22facebook%22%2C%22contactEmail%22%3A%22someone%40gmail.com%22%7D")
    });
});

describe("category element component", function () {

    let checkedCategory = {
        name: "Marketing Technology",
        id: 5,
        children: {
            45: {
                name: "Email Optimization",
                id: 45,
                parent_id: 5,
                nest_level: 1,
                children: []
            },
            46: {
                name: "Email Service Providers",
                id: 46,
                parent_id: 5,
                nest_level: 1,
                children: []
            }
        }
    };
    let checkedIDS = [15, 5, 20, 46];

    let shallowWrapper = shallow(<CategoryElement catInfo={checkedCategory} checkedCats={checkedIDS}/>);
    it("should display a single list item", function () {
        expect(shallowWrapper.find("li").length).toEqual(1);
    });

    it("should display the category name", function () {
        expect(shallowWrapper.find("label").text()).toEqual("Marketing Technology");
    });

    it("should display the number of children with plus in a box on the right", function () {
        expect(shallowWrapper.find("a").text()).toEqual("[+2]");
    });
    it("should have the checkbox checked if the id is inside the checkedCats property", function () {
        expect(shallowWrapper.find("input").props().checked).toBe(true);
    });

});

describe("categories tab component", function () {

    let checkedCategory = {
        name: "Marketing Technology",
        id: 5,
        children: {
            45: {
                name: "Email Optimization",
                id: 45,
                parent_id: 5,
                nest_level: 1,
                children: []
            },
            46: {
                name: "Email Service Providers",
                id: 46,
                parent_id: 5,
                nest_level: 1,
                children: []
            }
        }
    };
    let checkedIDS = [15, 5, 20, 46];


    let aClickedWrapper = mount(<CategoriesTab nestedCats={{5:checkedCategory}} companyCats={checkedIDS}/>);
    aClickedWrapper.find("a").simulate("click");

    let childrenLI = aClickedWrapper.find("ul").find("li").find("ul").find("li");


    it("should add a ul when the + is clicked", function () {

        expect(aClickedWrapper.find("ul").length).toEqual(2);
    });

    it("should change the <a> to show the hide symbol", function () {
        expect(aClickedWrapper.find("a").text()).toEqual("[-]");
    });


    it("should display the correct number of children in a ul inside the current li of the main ul", function () {

        expect(childrenLI.length).toEqual(2);
    });

    it("should display the correct name for each child", function () {
        expect(childrenLI.map(li => li.text())).toEqual(["Email Optimization", "Email Service Providers"]);
    });

    it("should NOT check the checkbox of children whose IDs are in NOT checkedIDS", function () {
        expect(childrenLI.at(0).find("input").props().checked).toBe(false);
    });
    it("should check the checkbox of children whose IDs are in checkedIDS", function () {
        expect(childrenLI.at(1).find("input").props().checked).toBe(true);
    });

    it("should hide the categories when the a button is clicked again", function () {
        aClickedWrapper.find("a").first().simulate("click");
        expect(aClickedWrapper.find("ul").length).toEqual(1);
    });


});

describe("search bar component", function () {
    let exampleCompanies = [
        {
            "id": "1",
            "name": "Facebook"
        },
        {
            "id": "2",
            "name": "ShareThis"
        },
        {
            "id": "3",
            "name": "AddThis"
        },
        {
            "id": "4",
            "name": "Tynt"
        },
        {
            "id": "9999",
            "name": "Gigya"
        }
    ];

    var spy = sinon.spy();
    let searchBar = mount(<SearchBar changeResultCallback={spy} companies={exampleCompanies}/>);

    it("should display the correct number of results", function (){
        expect(searchBar.find("div.companies-holder").children().length).toEqual(5);
    });

    it("should display the proper id for each company", function (){
        expect(searchBar.find("div.companies-holder").children().at(0).text().startsWith("1")).toBe(true);
        expect(searchBar.find("div.companies-holder").children().at(1).text().startsWith("2")).toBe(true);
        expect(searchBar.find("div.companies-holder").children().at(2).text().startsWith("3")).toBe(true);
        expect(searchBar.find("div.companies-holder").children().at(3).text().startsWith("4")).toBe(true);
        expect(searchBar.find("div.companies-holder").children().at(4).text().startsWith("9999")).toBe(true);
    });

    it("should display the proper name for each company", function () {
        expect(searchBar.find("div.companies-holder").children().at(0).text().endsWith("Facebook")).toBe(true);
        expect(searchBar.find("div.companies-holder").children().at(1).text().endsWith("ShareThis")).toBe(true);
        expect(searchBar.find("div.companies-holder").children().at(2).text().endsWith("AddThis")).toBe(true);
        expect(searchBar.find("div.companies-holder").children().at(3).text().endsWith("Tynt")).toBe(true);
        expect(searchBar.find("div.companies-holder").children().at(4).text().endsWith("Gigya")).toBe(true);
    });

    it("should filter search results based on the text", function () {
        searchBar.setState({searchFilter : "Gigya"});
        expect(searchBar.find("div.companies-holder").children().at(0).text().endsWith("Gigya")).toBe(true);
    });

    it("should be able to show multiple results", function () {
        searchBar.setState({searchFilter : "i"});
        expect(searchBar.find("div.companies-holder").children().length).toEqual(3);
    });

    it("should be able to search for any case", function () {
        searchBar.setState({searchFilter : "aDdTHiS"});
        expect(searchBar.find("div.companies-holder").children().at(0).text().endsWith("AddThis")).toBe(true);
    });

    it("should call the callback with the id of the company that was clicked", function (){

        searchBar.setState({searchFilter : ""});
        searchBar.find(".com-item").at(0).simulate("click"); //click facebook
        searchBar.find(".com-item").at(4).simulate("click"); //click Gigya
        searchBar.find(".com-item").at(2).simulate("click"); //click AddThis

        expect(spy.getCall(0).args[0]).toEqual(1);
        expect(spy.getCall(1).args[0]).toEqual(9999);
        expect(spy.getCall(2).args[0]).toEqual(3);
    });

});

describe("basic info component", function () {

    let oldInfo = {
        "id": "1",
        "name": "Facebook",
        "description": "Facebook is a company",
        "contactEmail": "",
        "contactPhone": "+1.650.543.4800",
        "website": "www.facebook.com",
        "facebookURL": "http://www.facebook.com/facebook",
        "twitter": "facebook"
    };

    //The same everywhere except description and contact email have changed and twitter is deleted
    let newInfo = {
        "description": "THIS IS A DIFFERENT DESCRIPTION",
        "contactEmail": "THIS IS A NEW EMAIL",
        "twitter": "" //deleted twitter
    };

    let basicInfoTab = mount(<BasicInfoTab compInfo={oldInfo} newCompInfo={newInfo} />);


    it("should set the h3 tag to the company name", function () {
       expect(basicInfoTab.find("h3").text()).toEqual("Facebook");
    });

    it("should use the old info when there isn't new info", function (){
       expect(basicInfoTab.find("#website").props().value).toEqual("www.facebook.com");
       expect(basicInfoTab.find("#facebookURL").props().value).toEqual("http://www.facebook.com/facebook");
       expect(basicInfoTab.find("#contactPhone").props().value).toEqual("+1.650.543.4800");
    });

    it("should use the new info if it is available", function () {
        expect(basicInfoTab.find("#description").props().value).toEqual("THIS IS A DIFFERENT DESCRIPTION");
        expect(basicInfoTab.find("#contactEmail").props().value).toEqual("THIS IS A NEW EMAIL");
        expect(basicInfoTab.find("#twitter").props().value).toEqual("");
    });

});

describe("app component", function () {
    let someCompanies = [
        {
            "id": "1",
            "name": "Facebook"
        },
        {
            "id": "2",
            "name": "ShareThis"
        },
        {
            "id": "3",
            "name": "AddThis"
        },
        {
            "id": "4",
            "name": "Tynt"
        },
        {
            "id": "5",
            "name": "Gigya"
        },
        {
            "id": "6",
            "name": "MediaMath"
        },
        {
            "id": "7",
            "name": "invitemedia"
        },
        {
            "id": "8",
            "name": "Turn"
        },
        {
            "id": "9",
            "name": "DataXu"
        },
        {
            "id": "10",
            "name": "EfficientFrontier"
        },
        {
            "id": "11",
            "name": "theTradeDesk"
        },
        {
            "id": "13",
            "name": "Simpli.fi"
        },
        {
            "id": "14",
            "name": "CentroDSP"
        }
    ];
    let appComponent = mount(<App />);
    it("should  display all the companies as soon as it's allCompanies state is set", function (){
        appComponent.setState({allCompanies : someCompanies});
        expect(appComponent.find(".com-item").length).toEqual(13);
    });

});
