import {React,Component} from 'react';
import { Redirect } from "react-router-dom";
import axios from 'axios';

import KEYS from "../settings.js";

import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';

import Cookies from 'js-cookie';

class ChangePassword extends Component{
    constructor(props){
        super(props);
        this.state = {
            email:'',
            redirect: '/',
            flag: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event){
        this.setState({"email": event.target.value});
    }

    handleSubmit(event){
        event.preventDefault();
        const headers = {"X-CSRFTOKEN": Cookies.get('csrftoken')};

        axios
            .post( KEYS.API_URL + 'api/reset-password/',{email: this.state.email}, {headers: headers})
            // SHOW A POPUP THAT THE USER SHOULD GO TO HIS EMAIL
            .then(res => {
                if(res.status == "204"){
                    this.setState({flag:true})
                }
            })
    }

    useStyles = makeStyles((theme) => ({
          paper: {
            marginTop: theme.spacing(8),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          },
          avatar: {
            margin: theme.spacing(1),
            backgroundColor: theme.palette.secondary.main,
          },
          form: {
            width: '100%',
            marginTop: theme.spacing(1),
          },
          submit: {
            margin: theme.spacing(3, 0, 2),
          },
    }));

    render(){
        return(
       <Container component="main" maxWidth="xs" style={{height:"90vh", paddingTop:"5%"}}>
      <CssBaseline />
      <div className={this.useStyles.paper}>
        <Avatar className={this.useStyles.avatar} style={{margin:"auto"}}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" style={{textAlign:"center"}}>
          Forgot Password
        </Typography>
        {!this.state.flag ?
        <form className={this.useStyles.form} noValidate onSubmit={ this.handleSubmit }>
          <TextField
            onChange= {this.handleChange}
            value={this.state.email}
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={this.useStyles.submit}
          >
            Submit
          </Button>
        </form>
        :
        <Typography component="h1" variant="h5">
          A password reset email has been sent. Please check your email and click on the link.
        </Typography>
        }
      </div>
    </Container>
    );}
}

export default ChangePassword

