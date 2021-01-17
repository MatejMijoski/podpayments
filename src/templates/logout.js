import {React,Component} from 'react';
import axios from 'axios';
import { Redirect } from "react-router-dom";
import KEYS from "../settings.js";

class LogOut extends Component{
constructor(props){
        super(props);
        this.state = {
            redirect: "/signin",
        };

    }
    componentDidMount(){
        axios
            .get(KEYS.API_URL + 'api/logout/',{
                headers: {'Authorization': 'Token ' + sessionStorage.getItem('token')}
            })
            .then(res => {
                sessionStorage.clear();
                window.location = "/signin";
            })
    }


    render(){
            return <Redirect to={this.state.redirect} />;
    }
}

export default LogOut;