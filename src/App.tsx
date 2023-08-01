import { useEffect, useState } from 'react';
import {Amplify, Auth, Hub } from 'aws-amplify';
import getCurrentTransaction from '@elastic/apm-rum';
import { init as initApm } from '@elastic/apm-rum'


Amplify.configure({
  Auth: {
    region: 'ap-northeast-1',
    userPoolId: 'ap-northeast-1_ZJWTVR2jR',
    userPoolWebClientId: '66r6ip7ep0f78f5kc85evv6mqq',
    oauth: {
      domain: 'hasegawa.auth.ap-northeast-1.amazoncognito.com',
      redirectSignIn: 'https://sre-train-dev-alb-421312269.ap-northeast-1.elb.amazonaws.com/',
      redirectSignOut: 'https://sre-train-dev-alb-421312269.ap-northeast-1.elb.amazonaws.com/',
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
      var apm = require('@elastic/apm-rum').init();
      apm.setUserContext(userData);
      console.log(userData);
      return userData;
    } catch (e) {
      return console.log('Not signed in');
    }
  }

  return user ? (
    <div>
      <p>サインイン済み</p>
      <p>ユーザー名: {user.username}</p>
      <button onClick={() => Auth.signOut()}>Sign Out</button>
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
