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
  
//   Auth.currentAuthenticatedUser().then(user => {
//     const transaction = getCurrentTransaction();
//     transaction.setUserContext({
//       username: user.username,
//        // 他のユーザー情報を追加する
//     });
//  });
 // apm.addLabels({ [ user.username]: user.username });

  
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
//      var apm = require('@elastic/apm-rum').init();
      var apm = initApm({

        // Set required service name (allowed characters: a-z, A-Z, 0-9, -, _, and space)
        serviceName: 'my-service-name',

        // Set custom APM Server URL (default: http://localhost:8200)
        serverUrl: 'https://19bcff45175e4fbaab61293e5749a606.apm.ap-northeast-1.aws.cloud.es.io:443',

        // Set the service version (required for source map feature)
        serviceVersion: '',

        // Set the service environment
        environment: 'my-environment'
      })
      apm.setUserContext(userData);
      apm.addLabels({ [ userData]: userData });
      const transaction = getCurrentTransaction();
      transaction.setUserContext({
        email: userData,
        // 他のユーザーデータを設定する
      });
//      const transaction = apm.startTransaction(userData, 'custom' );
//      const span = apm.startSpan(userData, userData);
//      transaction.addLabels({ [userData]: userData });
//      span.addLabels({ [userData]:userData });
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
