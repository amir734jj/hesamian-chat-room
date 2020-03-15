class BasicComponent extends React.Component {

    handleSubmit = submitHandler => event => {
        event.preventDefault();

        submitHandler(this.state);
    };
}

class Info extends BasicComponent {
    constructor() {
        super();
        this.state = {
            name: ""
        };
    }

    render() {
        const {submitHandler} = this.props;

        return (
            <form onSubmit={this.handleSubmit(submitHandler)}>
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                        type="name"
                        className="form-control"
                        id="name"
                        onChange={event => this.setState({name: event.target.value})}
                    />
                </div>
                <div className="form-group">
                    <button type="submit" className="btn btn-default">
                        Submit
                    </button>
                </div>
            </form>
        );
    }
}

class Messenger extends BasicComponent {

    constructor() {
        super();
        this.state = {text: ''}
    }


    render() {
        const {submitHandler, itemClass} = this.props;

        return (
            <form onSubmit={this.handleSubmit(submitHandler)} className={itemClass}>
                <div className="form-group">
                    <label htmlFor="message">Write the message text:</label>
                    <textarea className="form-control" id="message" placeholder="Enter message" required
                              onChange={event => this.setState({text: event.target.value})}/>
                </div>

                <div className="form-group">
                    <button type="submit" className="btn btn-success">
                        Echo
                    </button>
                </div>
            </form>
        );
    }
}

class Chat extends React.Component {
    constructor() {
        super();
        this.formatTime = time => new Date(time).toLocaleTimeString();
        this.state = {
            messages: [],
            name: "",
            logs: [],
            initialized: false
        };
    }

    componentDidMount() {
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl("/chat")
            .build();

        this.connection.on("Log", (event, count) => {
            this.setState(({logs}) => logs.unshift(`Event: ${event}: #${count}`));
        });

        this.connection.on("Announce", (_, name) => {
            this.setState(({logs}) => logs.unshift(`Announced: ${name}`));
        });

        this.connection.on("Inbox", message => {
            const {name, time} = message;

            this.setState(({logs}) => logs.unshift(`Echo from ${name} @ ${this.formatTime(time)}`));
            this.setState(({messages}) => messages.unshift(message));
        });

        this.connection.start();
    }

    componentWillUnmount() {
        this.connection.stop();
    }

    setInfoHandler = async ({name}) => {
        await this.setState({initialized: true, name});

        await this.connection.invoke("Announce", this.state);
    };

    sendMessage = async message => {
        await this.connection.invoke("Echo", Object.assign({time: new Date()}, message, this.state));
    };

    render() {
        return (
            <div>
                {this.state.initialized ? (
                    <div className={'row'}>
                        <span className="label label-primary pull-right"> {this.state.name}</span>
                        
                        <Messenger itemClass={'col-md-12'} submitHandler={this.sendMessage}/>
                        
                        <div className={'col-md-12'}>
                            {this.state.messages.map(({name, time, text}) => (
                                <div className="panel-group">
                                    <div className="panel panel-default">
                                        <div className="panel-heading"> {name} @ {this.formatTime(time)}</div>
                                        <div className="panel-body">{text}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className='clearfix col-md-12'>
                            <pre>
                                {this.state.logs.join("\n")}
                            </pre>
                        </div>
                    </div>
                ) : (
                    <Info submitHandler={this.setInfoHandler}/>
                )}
            </div>
        );
    }
}

class App extends React.Component {
    render() {
        return (
            <div>
                <h3>Chat Room</h3>
                <Chat/>
            </div>
        );
    }
}

ReactDOM.render(<App/>, document.getElementById("app"));
