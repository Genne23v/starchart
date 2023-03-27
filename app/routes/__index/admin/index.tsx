import {
  Container,
  Flex,
  FormControl,
  FormHelperText,
  Heading,
  Input,
  InputGroup,
  InputLeftAddon,
} from '@chakra-ui/react';
import type { Certificate, User } from '@prisma/client';
import type { ActionArgs, LoaderArgs } from '@remix-run/node';
import { Form, useSubmit } from '@remix-run/react';
import { useState } from 'react';
import { FaUsers, FaSearch, FaStickyNote } from 'react-icons/fa';
import { TbFileCertificate } from 'react-icons/tb';
import { useTypedActionData, useTypedLoaderData } from 'remix-typedjson';
import { z } from 'zod';
import { parseFormSafe } from 'zodix';
import AdminMetricCard from '~/components/admin/admin-metric-card';
import UsersTable from '~/components/admin/users-table';
import { getCertificateCount, getIssuedCertificateByUsername } from '~/models/certificate.server';
import {
  getDnsRecordCountByUsername,
  getDnsRecordCount,
  getUserCount,
  getUsersByEmail,
} from '~/models/dns-record.server';
import { requireUser } from '~/session.server';

export interface UserWithMetrics extends User {
  dnsRecordCount: number;
  certificate: Certificate | undefined;
}

export const MIN_USERS_SEARCH_TEXT = 3;

export const action = async ({ request }: ActionArgs) => {
  await requireUser(request);

  const actionParams = await parseFormSafe(
    request,
    z.object({
      searchText: z.string().min(MIN_USERS_SEARCH_TEXT),
    })
  );

  if (actionParams.success === false) {
    return [];
  }

  const { searchText } = actionParams.data;

  const users = await getUsersByEmail(searchText);

  const userStats = await Promise.all(
    users.map((user) =>
      Promise.all([
        getDnsRecordCountByUsername(user.username),
        getIssuedCertificateByUsername(user.username),
      ])
    )
  );

  const usersWithStats = users.map((user, index): UserWithMetrics => {
    const [dnsRecordCount, certificate] = userStats[index];

    return { ...user, dnsRecordCount, certificate };
  });

  return usersWithStats;
};

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
  return {
    userCount: await getUserCount(),
    dnsRecordCount: await getDnsRecordCount(),
    certificateCount: await getCertificateCount(),
  };
};

export default function AdminRoute() {
  const submit = useSubmit();

  const { userCount, dnsRecordCount, certificateCount } = useTypedLoaderData<typeof loader>();
  const users = useTypedActionData<typeof action>();

  const [searchText, setSearchText] = useState('');

  return (
    <Container maxW="container.xl">
      <Heading as="h1" size="xl" mt="8">
        Admin panel
      </Heading>
      <Flex flexWrap="wrap">
        <AdminMetricCard
          name="Users"
          tooltipText="Total number of users"
          value={userCount}
          IconComponent={FaUsers}
        />
        <AdminMetricCard
          name="Certificates"
          tooltipText="Total number of certificates"
          value={certificateCount}
          IconComponent={TbFileCertificate}
        />
        <AdminMetricCard
          name="DNS Records"
          tooltipText="Total number of DNS records"
          value={dnsRecordCount}
          IconComponent={FaStickyNote}
        />
      </Flex>
      <Heading as="h2" size="xl" mt="8" mb="4">
        Users
      </Heading>
      <Form method="post" onChange={(event) => submit(event.currentTarget)}>
        <FormControl>
          <InputGroup width={{ sm: '100%', md: 300 }}>
            <InputLeftAddon children={<FaSearch />} />
            <Input
              placeholder="Search..."
              name="searchText"
              value={searchText}
              onChange={(event) => setSearchText(event.currentTarget.value)}
            />
          </InputGroup>
          <FormHelperText>Please enter at least 3 characters to search.</FormHelperText>
        </FormControl>
      </Form>
      <UsersTable users={users ?? []} searchText={searchText} />
    </Container>
  );
}
