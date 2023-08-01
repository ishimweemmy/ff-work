import { IUser } from '@/domains/users/models/UserModel'
import { fakerEN } from '@faker-js/faker'
import signUp from '@/domains/users/services/signUp'
import cachedFixture from '@/tests/unit/fixture'


async function _userFixture (): Promise<IUser[]> {
  const accountArgs: Partial<IUser>[] = [{
    fullName: 'Test Developer',
    password: 'testPassword',
    provider: 'local',
    email: 'developer@test.net',
  }]
  for (let i = 0; i < 20; i++) {
    accountArgs.push({
      email: fakerEN.internet.email(),
      fullName: fakerEN.person.fullName(),
      password: fakerEN.internet.password(),
      provider: 'local',
    })
  }
  let accounts = [];
  for (let account of accountArgs) {
    let acc = await signUp(account)
    accounts.push(acc);
  }
  return accounts
}

const userFixture = cachedFixture(_userFixture)
export default userFixture