import {
  Table,
  Tr,
  Th,
  Thead,
  Tbody,
  TableContainer,
  Td,
  Card,
  IconButton,
  Tooltip,
  useToast,
  Flex,
  HStack,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import { FaTheaterMasks } from 'react-icons/fa';
import type { UserWithMetrics } from '~/routes/__index/admin';
import { MIN_USERS_SEARCH_TEXT } from '~/routes/__index/admin';
import { useNavigation } from '@remix-run/react';
import { useMemo } from 'react';

interface UsersTableProps {
  users: UserWithMetrics[];
  searchText: string;
}

export default function UsersTable({ users, searchText }: UsersTableProps) {
  const toast = useToast();
  const navigation = useNavigation();

  function onCopyNameToClipboard(subdomain: string) {
    navigator.clipboard.writeText(subdomain);
    toast({
      title: 'Email was copied to clipboard',
      position: 'bottom-right',
      status: 'success',
    });
  }

  const isInputValid = useMemo(
    () => searchText.length >= MIN_USERS_SEARCH_TEXT,
    [searchText.length]
  );

  const isLoading = useMemo(() => navigation.state === 'submitting', [navigation.state]);

  const shouldShowInstruction = useMemo(
    () => users.length === 0 && !isInputValid && !isLoading,
    [isInputValid, isLoading, users.length]
  );

  const shouldShowNoUsersMessage = useMemo(
    () => users.length === 0 && isInputValid && !isLoading,
    [isInputValid, isLoading, users.length]
  );

  const shouldShowUsers = useMemo(
    () => !(isLoading || shouldShowInstruction || shouldShowNoUsersMessage),
    [isLoading, shouldShowInstruction, shouldShowNoUsersMessage]
  );

  return (
    <Card p="2" mt="4">
      <TableContainer>
        <Table variant="striped" colorScheme="gray">
          <Thead>
            <Tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>DNS Records</Th>
              <Th>Certificate status</Th>
              <Th>Role</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {!shouldShowUsers && (
              <Tr>
                <Td py="8" colSpan={7}>
                  <Flex justifyContent="center">
                    {isLoading && <Spinner />}
                    {shouldShowInstruction && !isLoading && (
                      <Text>Please enter at least 3 characters to search</Text>
                    )}
                    {shouldShowNoUsersMessage && !isLoading && <Text>No users found</Text>}
                  </Flex>
                </Td>
              </Tr>
            )}

            {shouldShowUsers &&
              users.map((user) => {
                return (
                  <Tr key={user.email}>
                    <Td>
                      <Flex justifyContent="space-between" alignItems="center">
                        {user.email}
                        <Tooltip label="Copy email to clipboard">
                          <IconButton
                            icon={<CopyIcon color="black" boxSize="5" />}
                            variant="ghost"
                            ml="2"
                            onClick={() => onCopyNameToClipboard(user.email)}
                            aria-label="copy email"
                          />
                        </Tooltip>
                      </Flex>
                    </Td>
                    <Td>{user.displayName}</Td>
                    <Td>{user.dnsRecordCount}</Td>
                    <Td>{user.certificate ? user.certificate.status : 'Not issued'}</Td>
                    <Td>{user.group}</Td>
                    <Td>
                      <HStack>
                        <Tooltip label="Impersonate user">
                          <IconButton
                            aria-label="Impersonate user"
                            icon={<FaTheaterMasks color="black" size={24} />}
                            variant="ghost"
                          />
                        </Tooltip>
                        <Tooltip label="Deactivate user">
                          <IconButton
                            aria-label="Deactivate user"
                            icon={<DeleteIcon color="black" boxSize={5} />}
                            variant="ghost"
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                );
              })}
          </Tbody>
        </Table>
      </TableContainer>
    </Card>
  );
}
