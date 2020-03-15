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
        const { submitHandler } = this.props;

        return (
            <form onSubmit={this.handleSubmit(submitHandler)}>
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                        type="name"
                        className="form-control"
                        id="name"
                        onChange={event => this.setState({ name: event.target.value })}
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
        this.state = { text: '' }
    }


    render() {
        const { submitHandler } = this.props;

        return (
            <form onSubmit={this.handleSubmit(submitHandler)}>
                <div className="form-group">
                    <label htmlFor="message">Write the message text:</label>
                    <textarea className="form-control" id="message" placeholder="Enter message" required onChange={event => this.setState({ text: event.target.value })} />
                </div>

                <div className="form-group">
                    <button type="submit" className="btn btn-default">
                        Send
                    </button>
                </div>
            </form>
        );
    }
}

class Chat extends React.Component {
    constructor() {
        super();
        this.state = {
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
            this.setState(({ logs }) => logs.unshift(`Event: ${event}: #${count}`));
        });

        this.connection.on("Announce", (_, name) => {
            this.setState(({ logs }) => logs.unshift(`Announced: ${name}`));
        });

        this.connection.on("Inbox", ({text}) => {
            this.setState(({ logs }) => logs.unshift(`Received message: ${text}`));
        });

        this.connection.start();
    }

    componentWillUnmount() {
        this.connection.stop();
    }

    setInfoHandler = async ({ name }) => {
        await this.setState({ initialized: true, name });

        await this.connection.invoke("Announce", this.state);
    };
    
    sendMessage = async message => {
        await this.connection.invoke("Echo", message);
    };

    render() {
        return (
            <div>
                {this.state.initialized ? (
                    <div>
                        <span className="label label-primary"> {this.state.name}</span>

                        <div className='clearfix' style={{ margin: '2rem'}}>
                            <pre>
                                {this.state.logs.join("\n")}
                            </pre>
                        </div>
                        
                        <Messenger submitHandler={this.sendMessage} />
                    </div>
                ) : (
                    <Info submitHandler={this.setInfoHandler} />
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
                <Chat />
            </div>
        );
    }
}

ReactDOM.render(<App />, document.getElementById("app"));
