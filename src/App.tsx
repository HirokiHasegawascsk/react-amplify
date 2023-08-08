import { useEffect, useState } from 'react';
import {Amplify, Auth, Hub } from 'aws-amplify';
import axios from 'axios';

Amplify.configure({
  Auth: {
    region: 'ap-northeast-1',
    userPoolId: 'ap-northeast-1_ZJWTVR2jR',
    userPoolWebClientId: '66r6ip7ep0f78f5kc85evv6mqq',
    oauth: {
      domain: 'hasegawa.auth.ap-northeast-1.amazoncognito.com',
      redirectSignIn: 'https://dw0ywgza60ikh.cloudfront.net/index.html',
      redirectSignOut: 'https://dw0ywgza60ikh.cloudfront.net/index.html',
      responseType: 'token'
    }
  }
})

function App() {
  const [user, setUser] = useState<any | null>(null);
  
  useEffect(() => {
    Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
        case 'cognitoHostedUI':
          getUser().then(userData => setUser(userData));
          break;
        case 'signOut':
          setUser(null);
          break;
        case 'signIn_failure':
        case 'cognitoHostedUI_failure':
          console.log('Sign in failure', data);
          break;
      }
    });

    getUser().then(userData => setUser(userData));
  }, []);

  const getUser = async () => {
    try {
      const userData = await Auth.currentAuthenticatedUser();
      // デバッグ用
      Auth.currentSession().then((data) => {
        console.log(`token: ${data.getIdToken().getJwtToken()}`);
      });
      console.log(userData);
      return userData;
    } catch (e) {
      return console.log('Not signed in');
    }
  }
  const callLambdaFunction = async () => {
    try {
      const response = await axios.get('https://team-f.scsk-aidiv1.com');
      console.log('Lambda function response:https://team-f.scsk-aidiv1.com', response.data);
    } catch (e) {
      console.error('Failed to call Lambda function:', e);
    }
  }
  return user ? (
    <div>
      <p>サインイン済み</p>
      <p>ユーザー名: {user.username}</p>
      <button onClick={() => Auth.signOut()}>Sign Out</button>
      <button onClick={() => callLambdaFunction()}>Lambda関数を呼び出す</button>
    </div>
  ) : (
    <div>
      <p>
        サインインする
      </p>
      <button onClick={() => Auth.federatedSignIn()}>Sign In</button>
    </div>
  );
}

export default App;
